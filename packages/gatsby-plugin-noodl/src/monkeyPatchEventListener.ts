import * as u from '@jsmanifest/utils'
import fs from 'fs-extra'
import path from 'path'
import { parse, traverse, types as t, transformFromAstSync } from '@babel/core'
import type { NodePath } from '@babel/core'

export interface OnPatch {
  addEventListener: (...args: any[]) => any
  removeEventListener: (...args: any[]) => any
}

/**
 * Returns the path to the EventTarget file so it can be patched
 * @returns { string[] }
 */
export function getPathsToEventTargetFile() {
  const getFromCwd = (...p: string[]) =>
    path.resolve(
      path.join(
        process.cwd(),
        ...p,
        'node_modules/jsdom/lib/jsdom/living/generated/EventTarget.js',
      ),
    )
  const getFromCurrentDir = (...p: string[]) =>
    path.resolve(
      path.join(
        __dirname,
        ...p,
        'node_modules/jsdom/lib/jsdom/living/generated/EventTarget.js',
      ),
    )
  return [
    getFromCwd('..', '..', '..'),
    getFromCwd('..', '..'),
    getFromCwd('..'),
    getFromCurrentDir('..', '..', '..'),
    getFromCurrentDir('..', '..'),
    getFromCurrentDir('..'),
  ]
}

/**
 * addEventListener is preving sdk from sandboxing.
 * We must monkey patch the EventTarget
 */
export default function monkeyPatchAddEventListener(opts: {
  onPatch?: OnPatch
}): void {
  /**
   * Returns true if this node is the wrapper that encapsulates the declaration of class EventTarget
   */
  const isExportsStatementWrappingEventTarget = (p: NodePath) => {
    // @ts-expect-error
    if (t.isAssignmentExpression(p.node.expression)) {
      const { left, right, operator } = (p.node as any)
        .expression as t.AssignmentExpression
      return (
        operator === '=' &&
        t.isMemberExpression(left) &&
        t.isIdentifier(left.object) &&
        t.isIdentifier(left.property) &&
        left.object.name === 'exports' &&
        left.property.name === 'install' &&
        t.isArrowFunctionExpression(right)
      )
    }
  }

  const getEventTargetClassStatement = (expr: t.ArrowFunctionExpression) => {
    if (t.isBlockStatement(expr.body)) {
      return expr.body.body.find((statement) =>
        t.isClassDeclaration(statement),
      ) as t.ClassDeclaration
    }
    return null
  }

  const getClassMethod = (node: t.ClassDeclaration, name: string) => {
    if (t.isClassBody(node.body)) {
      return node.body.body.find(
        // @ts-expect-error
        (o) => t.isClassMethod(o) && o.key.name === name,
      )
    }
    return null
  }

  const isMethodPatched = (node: t.ClassMethod) => {
    return (
      t.isBlockStatement(node.body) && t.isReturnStatement(node.body.body[0])
    )
  }

  getPathsToEventTargetFile().forEach((filepath) => {
    try {
      if (!fs.existsSync(filepath)) return

      console.log(`Patching ${u.white(filepath)}`)

      const code = fs.readFileSync(filepath, 'utf8')
      const ast = parse(code)

      let eventListenersWerePatched = true

      traverse(ast, {
        ExpressionStatement(p) {
          if (isExportsStatementWrappingEventTarget(p)) {
            const eventTargetClass = getEventTargetClassStatement(
              // @ts-expect-error
              p.node.expression.right,
            )

            const addEventListenerMethod = getClassMethod(
              eventTargetClass as t.ClassDeclaration,
              'addEventListener',
            )
            const removeEventListenerMethod = getClassMethod(
              eventTargetClass as t.ClassDeclaration,
              'removeEventListener',
            )

            for (const [evtName, method] of [
              ['addEventListener', addEventListenerMethod],
              ['removeEventListener', removeEventListenerMethod],
            ] as const) {
              // @ts-expect-error
              if (isMethodPatched(method)) {
                opts?.onPatch?.[evtName]?.({ wasPatched: true })
              } else {
                eventListenersWerePatched = false
                opts?.onPatch?.[evtName]?.({ wasPatched: false })
                // @ts-expect-error
                if (t.isBlockStatement(method.body)) {
                  // @ts-expect-error
                  method.body.body.unshift(t.returnStatement())
                }
              }
            }

            return p.stop()
          }
        },
      })

      if (!eventListenersWerePatched) {
        const result = transformFromAstSync(ast as any)
        fs.writeFileSync(filepath, result?.code || '', 'utf8')
        return result
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
    }
  })
}

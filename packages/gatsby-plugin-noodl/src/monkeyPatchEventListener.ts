import * as u from '@jsmanifest/utils'
import fs from 'fs-extra'
import path from 'path'
import { parse, traverse, types as t, transformFromAstSync } from '@babel/core'
import type { NuiComponent, NUI } from 'noodl-ui'
import type { NodePath } from '@babel/core'

export interface OnPatch {
  addEventListener: (...args: any[]) => any
  removeEventListener: (...args: any[]) => any
}

/**
 * Returns the path to the EventTarget file so it can be patched
 * @returns { string }
 */
export function getPathToEventTargetFile() {
  return path.resolve(
    path.join(
      process.cwd(),
      '../../node_modules/jsdom/lib/jsdom/living/generated/EventTarget.js',
    ),
  )
}

/**
 * addEventListener is preving sdk from sandboxing.
 * We must monkey patch the EventTarget
 */
export default function monkeyPatchAddEventListener(opts: {
  onPatch?: OnPatch
}):
  | Promise<{ components: NuiComponent.Instance[]; nui: typeof NUI }>
  | undefined {
  try {
    const code = fs.readFileSync(getPathToEventTargetFile(), 'utf8')
    const ast = parse(code)

    /**
     * Returns true if this node is the wrapper that encapsulates the declaration of class EventTarget
     */
    function isExportsStatementWrappingEventTarget(p: NodePath) {
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

    function getEventTargetClassStatement(expr: t.ArrowFunctionExpression) {
      if (t.isBlockStatement(expr.body)) {
        return expr.body.body.find((statement) =>
          t.isClassDeclaration(statement),
        ) as t.ClassDeclaration
      }
      return null
    }

    function getClassMethod(node: t.ClassDeclaration, name: string) {
      if (t.isClassBody(node.body)) {
        return node.body.body.find(
          // @ts-expect-error
          (o) => t.isClassMethod(o) && o.key.name === name,
        )
      }
      return null
    }

    function isMethodPatched(node: t.ClassMethod) {
      return (
        t.isBlockStatement(node.body) && t.isReturnStatement(node.body.body[0])
      )
    }

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
      console.log('getPathToEventTargetFile', getPathToEventTargetFile())
      const result = transformFromAstSync(ast)
      fs.writeFileSync(getPathToEventTargetFile(), result.code, 'utf8')
      // @ts-expect-error
      return result
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
  }
}

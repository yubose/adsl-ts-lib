import * as fp from './utils/fp'
import * as is from './utils/is'
import * as t from './types'
import type Root from './Root'

export interface VisitorFn {
  (args: t.VisitFnArgs): any
}

function wrap(
  callback: VisitorFn,
  {
    data,
    page,
    root,
    helpers,
  }: Pick<t.VisitFnArgs, 'data' | 'page' | 'root'> & t.VisitorOptions,
) {
  const getControl = (control: ReturnType<VisitorFn>) => {
    // if (control != undefined) {
    //   if (control === y.visitAsync.BREAK) {
    //     return y.visitAsync.BREAK
    //   }
    //   if (control === y.visitAsync.REMOVE) {
    //     return y.visitAsync.REMOVE
    //   }
    //   if (control === y.visitAsync.SKIP) {
    //     return y.visitAsync.SKIP
    //   }
    //   if (y.isNode(control)) {
    //     return control
    //   }
    //   if (typeof control === 'number') {
    //     return control
    //   }
    // }
    // return undefined
  }

  const onVisit = function onVisit<Fn extends VisitorFn>(
    key: number | string | null,
    node: unknown,
    path = [] as (number | string)[],
  ) {
    const callbackArgs = {
      ...helpers,
      data,
      key,
      node,
      path,
      page,
      root,
    }

    const result = callback?.(callbackArgs)

    if (is.promise(result)) {
      return result
        .then((control) => getControl(control as ReturnType<Fn>))
        .catch((error) => {
          throw error instanceof Error ? error : new Error(String(error))
        })
    }

    return getControl(result as ReturnType<Fn>)
  }

  return onVisit
}

class Visitor extends t.AVisitor {
  #callback: VisitorFn | undefined

  get callback() {
    return this.#callback
  }

  visit<N = unknown>(
    node: N,
    {
      asserters,
      helpers,
      init,
      data = {},
      page,
      path = [],
      root,
    }: t.VisitorOptions & { root: Root },
  ) {
    init?.({ data, ...helpers, root })

    const fn = wrap(this.#callback as any, {
      asserters,
      data,
      page,
      root,
      helpers,
    })

    const visit = (node: unknown, path: (number | string)[] = []) => {
      if (is.arr(node)) {
        for (let key = 0; key < node.length; key++) {
          const item = node[key]
          const nextPath = path.concat(key)
          const control = fn(key, item, nextPath)
          // TODO - control
          visit(node, nextPath)
        }
      } else if (is.obj(node)) {
        const entries = fp.entries(node)
        const numEntries = entries.length

        for (let index = 0; index < numEntries; index++) {
          const [key, child] = entries[index]
          const nextPath = path.concat(key)
          const control = fn(key, child, nextPath)
          // TODO - control
          if (is.obj(child)) {
            visit(child, nextPath)
          }
        }
      } else {
        const control = fn(null, node, path)
        // TODO - control
      }
    }

    visit(node, path)

    return data
  }

  async visitAsync<N = unknown>(
    node: N,
    {
      asserters,
      data = {},
      init,
      helpers,
      page,
      path = [],
      root,
    }: Partial<t.VisitorOptions<Record<string, any>>>,
  ): Promise<any> {
    try {
      await init?.({ data, ...helpers, root })

      const fn = wrap(this.#callback, {
        asserters,
        data,
        page,
        root,
        helpers,
      })

      const visit = async (node: unknown, path: (number | string)[] = []) => {
        if (is.arr(node)) {
          for (let key = 0; key < node.length; key++) {
            const item = node[key]
            const nextPath = path.concat(key)
            const control = await fn(key, item, nextPath)
            // TODO - control
            await visit(node, nextPath)
          }
        } else if (is.obj(node)) {
          const entries = fp.entries(node)
          const numEntries = entries.length

          for (let index = 0; index < numEntries; index++) {
            const [key, child] = entries[index]
            const nextPath = path.concat(key)
            const control = await fn(key, child, nextPath)
            // TODO - control
            if (is.obj(child)) {
              await visit(child, nextPath)
            }
          }
        } else {
          const control = await fn(null, node, path)
          // TODO - control
        }
      }

      await visit(node, path)

      return data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    }
  }

  use(callback: VisitorFn) {
    this.#callback = callback
    return this
  }
}

export default Visitor

import y from 'yaml'
import { AVisitor, is as coreIs, fp, trimReference } from 'noodl-core'
import type { BuiltIns, VisitorOptions, VisitFnArgs } from 'noodl-core'
import getYamlNodeKind from './utils/getYamlNodeKind'
import is from './utils/is'
import unwrap from './utils/unwrap'
import { isScalar, isPair, isMap, isSeq } from './utils/yaml'
import { getScalarType, getMapKind } from './compiler/utils'
import * as c from './constants'
import * as t from './types'

export type State = typeof _state
export type DocVisitorAsserterInput =
  | t.DocVisitorAssertConfig
  | t.DocVisitorAssertConfig[]

function getInitialState() {
  return {
    sync: {
      history: [],
      queue: [],
    } as t.VisitorState,
    async: {
      history: [],
      queue: [],
    } as t.VisitorState,
  }
}

let _state = getInitialState()

export function getState(): State
export function getState(type: 'sync'): State['sync']
export function getState(type: 'async'): State['async']
export function getState(type?: 'async' | 'sync') {
  switch (type) {
    case 'async':
    case 'sync':
      return _state[type]
    default:
      return _state
  }
}

export function clearState() {
  _state = getInitialState()
}

function decorate() {
  const wrapDecoratedVisitFn = function wrappedDecoratedVisitFn(
    wrappedFn,
    isAsync: boolean,
  ) {
    return function wrappedVisit<N = unknown>(
      this: AVisitor,
      node: N,
      args: Pick<VisitorOptions, 'asserters' | 'builtIn'> & VisitFnArgs,
      state?: {
        calledInit?: boolean
      },
    ) {
      const { data, helpers, init, root } = args || {}
      const initArgs = { data, ...helpers, root } as VisitFnArgs

      if (isAsync) {
        if (!state?.calledInit && init) {
          const wrapperArgs = { ...state, calledInit: true }
          return init(initArgs)
            .then(() => wrappedVisit.call(this, node, args, wrapperArgs))
            .catch((error: unknown) => {
              throw error instanceof Error ? error : new Error(String(error))
            })
        }
      } else {
        init?.(initArgs)
      }
      if (y.isNode(node) || y.isDocument(node)) {
        const visitFn = wrappedFn.call(null, node, args)
        if (coreIs.promise(visitFn)) {
          return visitFn.then((fn) =>
            fn(node, wrap(this.callback as any, isAsync, args)),
          )
        }
        if ('has' in node) {
          if (node.has('init')) {
            visitFn(node.get('init'), wrap(this.callback as any, isAsync, args))
          }
        }
        return visitFn(node, wrap(this.callback as any, isAsync, args))
      }
    }
  }

  return function decoratedVisitFn(
    target: AVisitor,
    property: string,
    descriptor: PropertyDescriptor,
  ) {
    const isAsync = property === 'visitAsync'
    descriptor.configurable = false
    descriptor.enumerable = false
    descriptor.value = wrapDecoratedVisitFn(target[property], isAsync)
  }
}

export interface DocVisitorCallback<Fn extends t.AssertAsyncFn | t.AssertFn> {
  (args: Parameters<Fn>[0]): ReturnType<Fn>
}

function wrap<Fn extends t.AssertAsyncFn | t.AssertFn>(
  enter: DocVisitorCallback<Fn>,
  isAsync: boolean,
  {
    asserters,
    builtIn,
    data,
    page,
    root,
    helpers,
  }: Omit<VisitorOptions, 'asserters'> &
    Pick<VisitFnArgs, 'data' | 'page' | 'root'> & {
      asserters?: DocVisitorAsserterInput
    },
) {
  function onEnter<N = unknown>({
    asserters,
    builtIn,
    clearState,
    getState,
    isAsync,
    data,
    node,
    root,
    key,
    path,
    page,
  }: t.VisitorStateHelpers &
    VisitFnArgs<Record<string, any>, N> & {
      asserters?: DocVisitorAsserterInput
      path: Parameters<y.visitorFn<N>>[2]
    }) {
    const getCurrentState = () => getState(isAsync ? 'async' : 'sync')
    const nodeKind = getYamlNodeKind(node)

    for (const asserter of fp.toArr(asserters)) {
      if (asserter?.cond(nodeKind, node)) {
        // Second argument (assert utilities) is already provided by createAssert
        // TODO - Find how to help TypeScript notice thisdeeee4ee
        // @ts-expect-error
        const result = asserter.fn(arguments[0])
        if (!coreIs.und(result)) return result
      }
    }

    if (isScalar(node)) {
      const scalarType = getScalarType(node)
    } else if (isPair(node)) {
      //
    } else if (isMap(node)) {
      const mapKind = getMapKind(node)
      switch (mapKind) {
        case c.MapKind.Action:
        case c.MapKind.BuiltInFn:
        case c.MapKind.Component:
        case c.MapKind.Emit:
        case c.MapKind.Goto:
        case c.MapKind.If: {
          const q = {} as t.VisitorQueueObject
          q.kind = mapKind
          q.node = node
          q.status = c.VisitorQueueStatus.Pending
          getCurrentState().queue.push(q)
          break
        }
        case c.MapKind.Style:
        default:
          break
      }
    } else if (isSeq(node)) {
      //
    }

    return enter?.(arguments[0])
  }

  function getControl<N = unknown>(control: ReturnType<y.visitorFn<N>>) {
    if (control != undefined) {
      // Terminate
      if (control === y.visitAsync.BREAK) return y.visitAsync.BREAK
      // Remove node, then continue with next node
      if (control === y.visitAsync.REMOVE) return y.visitAsync.REMOVE
      // Do not visit the children of this node, continue with next sibling
      if (control === y.visitAsync.SKIP) return y.visitAsync.SKIP
      // Replace the current node, then continue by visiting it
      if (y.isNode(control)) return control
      // While iterating a seq/map, set index of next step.
      // Useful if index of the current node changed
      if (coreIs.num(control)) return control
    }
  }

  function onVisit<N = unknown>(
    stateHelpers: t.VisitorStateHelpers,
    ...[key, node, path]: Parameters<y.visitorFn<N>>
  ) {
    const callbackArgs = {
      ...stateHelpers,
      ...helpers,
      asserters,
      builtIn,
      data,
      key,
      node,
      path,
      page,
      root,
    }
    // @ts-expect-error
    const result = onEnter(callbackArgs)
    if (coreIs.promise(result)) {
      return result.then(getControl).catch((error) => {
        throw error instanceof Error ? error : new Error(String(error))
      })
    }
    return getControl(result)
  }

  return onVisit.bind(null, { clearState, getState, isAsync })
}

class DocVisitor<H = any, B extends BuiltIns = BuiltIns> extends AVisitor<
  any,
  H,
  B
> {
  #callback: any

  get callback() {
    return this.#callback
  }

  @decorate()
  visit() {
    return y.visit
  }

  @decorate()
  async visitAsync() {
    return y.visitAsync
  }

  use<Fn extends t.AssertAsyncFn | t.AssertFn>(
    callback: DocVisitorCallback<Fn>,
  ) {
    this.#callback = callback
    return this
  }
}

export default DocVisitor

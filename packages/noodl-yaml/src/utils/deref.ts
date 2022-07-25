/**
 * State pattern dereferencer
 */
import y from 'yaml'
import { is as coreIs, fp, getRefProps } from 'noodl-core'
import type { ARoot } from 'noodl-core'
import type { ReferenceString } from 'noodl-types'
import get from './get'
import is from './is'
import unwrap from './unwrap'
import type DocRoot from '../DocRoot'

type Action =
  | { type: ActionType.Next }
  | { type: ActionType.Start; depth: number; reference: ReferenceString }

const enum ActionType {
  Start = 1,
  Next = 2,
}

export interface DerefOptions {
  depth?: number
  node: y.Scalar<string> | string
  root?: ARoot | DocRoot
  rootKey?: y.Scalar | string
  subscribe?: {
    onUpdate?: (prevState: any, nextState: any) => void
  }
}

export interface DerefResult {
  depth: number
  initiator: string
  key: string
  value: any
  path?: string[]
  prevKey?: string
}

function createDerefReducer(
  root: ARoot | DocRoot | undefined,
  { rootKey, ...subscribers } = {} as DerefOptions['subscribe'] & {
    rootKey?: string
  },
) {
  let _result: any
  let _state = {
    depth: 0,
    initialValue: undefined as string | undefined,
    paths: [] as string[],
    results: [] as DerefResult[],
  }

  function reducer(
    state: typeof _state,
    action: Parameters<typeof dispatch>[0],
  ) {
    switch (action.type) {
      case ActionType.Start: {
        const refProps = getRefProps(action.reference)
        const { isLocalRef, paths, ref: initiator } = refProps

        if (isLocalRef && rootKey) paths.unshift(rootKey)
        _result = get(root?.value, paths[0] as string, { rootKey })

        const nextResults = state.results.concat({
          depth: action.depth,
          initiator,
          key: paths[0],
          value: is.ymlNode(_result) ? _result?.toJSON?.() : _result,
        })

        return {
          ...state,
          depth: action.depth,
          initialValue: action.reference,
          paths: paths.slice(1),
          results: nextResults,
        }
      }
      case ActionType.Next: {
        const currResults = [...state.results]

        _result = get(_result, state.paths[0], { rootKey })

        currResults.push({
          initiator: state.initialValue as string,
          depth: state.depth,
          key: state.paths[0],
          value: is.ymlNode(_result) ? _result?.toJSON?.() : _result,
        })

        let nextPaths = state.paths.slice(1)
        let nextDerefed: ReturnType<typeof deref>

        if (
          (coreIs.str(_result) && coreIs.reference(_result)) ||
          (is.scalarNode(_result) && is.reference(_result))
        ) {
          // The result is the current reference or another (chained) reference.
          // Correctly prepare the next props for pathing
          let refProps = getRefProps(unwrap(_result) as ReferenceString)
          let isRootRef = !refProps.isLocalRef
          let isSameRootKey = true
          let nextRootKey = rootKey

          if (!(isRootRef && refProps.paths[0] === rootKey)) {
            isSameRootKey = false
          }

          if (isRootRef) {
            if (isSameRootKey) {
              refProps.paths = refProps.paths.slice(1)
              refProps.path = refProps.paths.join('.')
              nextPaths.unshift(...refProps.paths)
            } else nextRootKey = refProps.paths[0]
          }

          nextDerefed = deref({
            depth: state.depth,
            node: refProps.ref,
            root,
            rootKey: nextRootKey,
          })

          const children = nextDerefed.results
            ?.slice(isRootRef ? 0 : 1)
            .map((obj, i, coll) => {
              const depth = coreIs.num(obj.depth) ? obj.depth : state.depth
              const prevKey = coll[i - 1]?.key
              const initiator = nextDerefed.initialValue
              const meta = { ...obj, depth, initiator }
              if (prevKey) meta.prevKey = prevKey
              meta.path = coll.map((obj) => obj.key)
              return meta
            })

          currResults.push(...(children as DerefResult[]))
          _result = unwrap(nextDerefed.value)
        }

        return {
          ...state,
          paths: nextPaths,
          results: currResults,
        }
      }
    }
  }

  function dispatch(action: Action) {
    const prevState = _state
    _state = reducer(_state, action) as typeof _state
    subscribers?.onUpdate?.(prevState, _state)
  }

  return { getState: () => ({ ..._state, value: _result }), dispatch }
}

function getRootKey(ref: ReferenceString, rootKey = '' as y.Scalar | string) {
  const { isLocalRef, paths } = getRefProps(ref)
  return (isLocalRef ? rootKey : paths[0]) as string
}

function deref({
  depth = -1,
  node,
  root,
  rootKey: rootKeyProp,
  subscribe,
}: DerefOptions) {
  const reference = unwrap(node) as ReferenceString
  const rootKey = getRootKey(reference, rootKeyProp)
  const derefer = createDerefReducer(root, { rootKey, ...subscribe })
  const { dispatch, getState } = derefer
  dispatch({ type: ActionType.Start, reference, depth: ++depth })
  getState().paths.forEach(() => dispatch({ type: ActionType.Next }))
  return { reference, ...fp.omit(getState(), ['paths']) }
}

export default deref

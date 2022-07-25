import type { LiteralUnion } from 'type-fest'
import y from 'yaml'
import { is, fp } from 'noodl-core'
import createNode from '../utils/createNode'
import _is_ from '../utils/is'
import merge from '../transformers/merge'
import unwrap from '../utils/unwrap'
import * as c from '../constants'
import * as t from '../types'

const { scalarNode, pairNode, mapNode, seqNode } = _is_

function createScalar(value?: any) {
  return new y.Scalar(value)
}

function createPair(key: y.Scalar | string, value?: any) {
  return new y.Pair(unwrap(key), createNode(value))
}

function createMap<K extends string, V = any>(
  key: K,
  value?: any,
): y.YAMLMap<K, V>
function createMap<V extends y.Pair[]>(
  nodes: V,
): y.YAMLMap<V[number]['key'], V[number]['value']>
function createMap<K = any, V = any>(node: y.Pair<K, V>): y.YAMLMap<K, V>
function createMap<V extends Record<string, any>, K extends keyof V>(
  obj: V,
): y.YAMLMap<keyof V, K>
function createMap(): y.YAMLMap
function createMap(
  keyOrValue?: y.Pair | y.Pair[] | string | { [key: string]: any },
  value?: any,
) {
  const node = new y.YAMLMap()

  if (!arguments.length) {
    return node
  }

  if (!is.und(value)) {
    node.set(unwrap(keyOrValue), createNode(value))
  } else {
    if (keyOrValue) {
      if (Array.isArray(keyOrValue)) {
        keyOrValue.forEach((item) => {
          if (pairNode(item)) {
            node.set(item.key, createNode(item.value as any))
          }
        })
      } else if (pairNode(keyOrValue)) {
        node.set(keyOrValue.key, createNode(keyOrValue.value as any))
      } else if (is.obj(keyOrValue)) {
        fp.entries(keyOrValue).forEach(([key, val]) => {
          node.set(key, createNode(val))
        })
      }
    }
  }

  return node
}

function createSeq(value?: any) {
  const node = new y.YAMLSeq()

  if (is.arr(value)) {
    value.forEach((item) => node.add(createNode(item)))
  } else if (arguments.length) {
    node.add(createNode(value))
  }

  return node
}

function createAction<T extends string>(
  actionType: T,
): y.YAMLMap<'actionType', T>
function createAction<O extends Record<string, any>>(
  props: O,
): y.YAMLMap<keyof O, O[keyof O]>
function createAction(): y.YAMLMap<'actionType'>
function createAction<T extends string = string>(
  actionTypeOrProps?: Record<string, any> | T,
) {
  const node = createMap()

  if (is.str(actionTypeOrProps)) {
    node.set('actionType', actionTypeOrProps)
  } else {
    merge(node, actionTypeOrProps)
  }

  return node
}

function createBuiltInFn<S extends string = string>(
  name: S,
  dataIn?: any,
  dataOut?: any,
) {
  const key = `=.builtIn.${name}` as const
  const node = new y.YAMLMap() as t.BuiltInEvalFn<`=.builtIn.${S}`>
  const obj = new y.YAMLMap<'dataIn' | 'dataOut', any>()
  node.set(key, obj)
  if (dataIn) obj.set('dataIn', createNode(dataIn))
  if (dataOut) obj.set('dataOut', createNode(dataOut))
  return node
}

function createComponent(props?: Record<string, any>): t.Component
function createComponent<T extends string>(
  type: T,
  props?: Record<string, any>,
): t.Component<T>
function createComponent<Type extends string>(
  type: Type,
  children?: any[],
): t.Component<'type'>
function createComponent<Type extends string>(
  type: Record<LiteralUnion<Type, string>, any> | Type,
  props?: any,
) {
  const componentType = is.str(type) ? type : type.type
  const node = createMap('type', componentType)

  if (is.str(type)) {
    if (_is_.ymlNode(props)) {
      merge(node, props)
    } else if (is.arr(props)) {
      props.forEach((item) => merge(node, createNode(item)))
    } else if (is.obj(props)) {
      merge(node, createNode(props))
    }
  } else if (is.obj(type)) {
    merge(node, type)
  }

  return node
}

function createEmit() {
  const node = createMap()
  return node
}

function createGoto() {
  const node = createMap()
  return node
}

function createIf(cond?: any, valTrue?: any, valFalse?: any) {
  const node = new y.YAMLMap() as t.If
  const ifNode = new y.YAMLSeq()
  // @ts-expect-error
  node.set('if', ifNode)
  ifNode.add(createNode(cond))
  ifNode.add(createNode(valTrue))
  ifNode.add(createNode(valFalse))
  return node
}

function createInit() {
  const node = new y.YAMLSeq()
  return node
}

function createListObject() {
  const node = createSeq()
  return node
}

function createLabel() {
  const node = createMap()
  return node
}
function createList() {
  const node = createMap()
  return node
}

function createListItem() {
  const node = createMap()
  return node
}

function createPage() {
  const node = new y.Document()
  return node
}

function createTextBoard() {
  const node = createMap()
  return node
}

const styleFactory = {
  border() {
    const node = createScalar()
    return node
  },
  top() {
    const node = createScalar()
    return node
  },
  left() {
    const node = createScalar()
    return node
  },
  width() {
    const node = createScalar()
    return node
  },
  height() {
    const node = createScalar()
    return node
  },
  margin() {
    const node = createScalar()
    return node
  },
  shadow() {
    const node = createScalar()
    return node
  },
  textColor() {
    const node = createScalar()
    return node
  },
  textAlign() {
    const node = createMap()
    return node
  },
}

const astFactory = {
  scalar: createScalar,
  pair: createPair,
  map: createMap,
  seq: createSeq,
  action: createAction,
  builtInFn: createBuiltInFn,
  component: createComponent,
  emit: createEmit,
  goto: createGoto,
  if: createIf,
  init: createInit,
  label: createLabel,
  listObject: createListObject,
  list: createList,
  listItem: createListItem,
  page: createPage,
  style: styleFactory,
  textBoard: createTextBoard,
}

export default astFactory

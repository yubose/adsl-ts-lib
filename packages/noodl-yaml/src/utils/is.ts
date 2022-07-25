import type { LiteralUnion } from 'type-fest'
import type { KnownStyleKeys, ReferenceString, StyleObject } from 'noodl-types'
import y from 'yaml'
import { findPair } from 'yaml/util'
import { is as coreIs } from 'noodl-core'
import getYamlNodeKind from './getYamlNodeKind'
import unwrap from './unwrap'
import { hasKeyStartsWith } from './has'
import type DocRoot from '../DocRoot'
import type { FileSystem } from './fileSystem'
import * as c from '../constants'
import * as t from '../types'

function isMapNodeContaining<K extends string, V = any>(
  ...args: [key: K | K[], value?: V]
) {
  return function contains(node: y.YAMLMap): node is y.YAMLMap<K, V> {
    const [key, value] = args
    return !!(
      node.has?.(key) &&
      (args.length === 2
        ? coreIs.arr(key)
          ? key.some((k) => node.get(k) === value)
          : node.get(key) === value
        : true)
    )
  }
}

function sameNodeType<N extends t.YAMLNode>(n1: unknown, n2: any): n2 is N {
  if (y.isNode(n1) && y.isNode(n2)) {
    if (y.isScalar(n1)) return y.isScalar(n2)
    if (y.isMap(n1)) return y.isMap(n2)
    if (y.isSeq(n1)) return y.isSeq(n2)
    if (y.isDocument(n1)) return y.isDocument(n2)
  }
  if (y.isPair(n1)) return y.isPair(n2)
  return false
}

function equalTo<N = any>(v1: unknown, v2: N): v1 is typeof v2 {
  if (y.isScalar(v1)) {
    if (y.isScalar(v2)) return unwrap(v1) === unwrap(v2)
    return unwrap(v1) === v2
  }

  if (y.isScalar(v2)) {
    if (y.isScalar(v1)) return unwrap(v2) === unwrap(v1)
    return unwrap(v2) === v1
  }

  if (y.isPair(v1) && y.isPair(v2)) {
    if (unwrap(v1.key) === unwrap(v2.key)) {
      if (sameNodeType(v1.value, v2.value)) {
        return equalTo(v1.value, v2.value)
      }
    }
    return false
  } else if (y.isMap(v1) && y.isMap(v2)) {
    if (v1.items.length === v2.items.length) {
      if (!v1.items.length) return true
      return v1.items.every((item) =>
        equalTo(item.value, findPair(v2.items, item.key)?.value),
      )
    }
  } else if (y.isSeq(v1) && y.isSeq(v2)) {
    if (v1.items.length !== v2.items.length) return false
    return v1.items.every((item, i) => equalTo(item, v2.items[i]))
  }

  return false
}

const is = {
  nil: (node: unknown): node is y.Scalar<null | undefined> =>
    coreIs.nil(unwrap(node)),
  equalTo,
  fileSystem: (value: unknown): value is FileSystem =>
    value !== null &&
    typeof value === 'object' &&
    value['_id_'] === c._symbol.fs,
  reference: (node: unknown): node is y.Scalar<ReferenceString> =>
    coreIs.reference(unwrap(node) as string),
  root: (node: unknown): node is DocRoot =>
    node !== null &&
    typeof node === 'object' &&
    node['_id_'] === c._symbol.root,
  scalarNode: (node: unknown): node is y.Scalar =>
    getYamlNodeKind(node) === c.Kind.Scalar,
  stringNode: (node: unknown): node is y.Scalar<string> =>
    is.scalarNode(node) && coreIs.str(node.value),
  pairNode: (node: unknown): node is y.Pair =>
    getYamlNodeKind(node) === c.Kind.Pair,
  mapNode: (node: unknown): node is y.YAMLMap =>
    getYamlNodeKind(node) === c.Kind.Map,
  seqNode: (node: unknown): node is y.YAMLSeq =>
    getYamlNodeKind(node) === c.Kind.Seq,
  documentNode: (node: unknown): node is y.YAMLSeq =>
    getYamlNodeKind(node) === c.Kind.Document,
  sameNodeType,
  action: isMapNodeContaining('actionType'),
  builtInFn: (node: unknown): node is y.YAMLMap<`=.builtIn.${string}`> =>
    is.mapNode(node) && hasKeyStartsWith(node, `=.builtIn`),
  // Components
  component: (
    node: y.YAMLMap,
  ): node is y.YAMLMap<'children' | 'style' | 'type'> => {
    return (
      is.componentLike(node) &&
      ['children', 'style'].some((key) => node.has(key))
    )
  },
  componentLike: isMapNodeContaining('type'),
  button: isMapNodeContaining('type', 'button'),
  canvas: isMapNodeContaining('type', 'canvas'),
  chart: isMapNodeContaining('type', 'chart'),
  chatList: isMapNodeContaining('type', 'chatList'),
  ecosDoc: isMapNodeContaining('type', 'ecosDoc'),
  divider: isMapNodeContaining('type', 'divider'),
  footer: isMapNodeContaining('type', 'footer'),
  header: isMapNodeContaining('type', 'header'),
  image: isMapNodeContaining('type', 'image'),
  label: isMapNodeContaining('type', 'label'),
  list: isMapNodeContaining('type', 'list'),
  listItem: isMapNodeContaining('type', 'listItem'),
  map: isMapNodeContaining('type', 'map'),
  page: isMapNodeContaining('type', 'page'),
  plugin: isMapNodeContaining('type', 'plugin'),
  pluginHead: isMapNodeContaining('type', 'pluginHead'),
  pluginBodyTail: isMapNodeContaining('type', 'pluginBodyTail'),
  popUp: isMapNodeContaining('type', 'popUp'),
  register: isMapNodeContaining('type', 'register'),
  select: isMapNodeContaining('type', 'select'),
  scrollView: isMapNodeContaining('type', 'scrollView'),
  textField: isMapNodeContaining('type', 'textField'),
  textView: isMapNodeContaining('type', 'textView'),
  video: isMapNodeContaining('type', 'video'),
  view: isMapNodeContaining('type', 'view'),
  emit: isMapNodeContaining<'emit', y.YAMLMap<'emit'>>('emit'),
  goto: isMapNodeContaining<'goto', t.NoodlNode<y.YAMLMap<'goto'>>>('goto'),
  if: isMapNodeContaining<'if', y.YAMLSeq<[unknown, unknown, unknown]>>('if'),
  style: isMapNodeContaining<
    LiteralUnion<KnownStyleKeys, string>,
    t.NoodlNode<y.YAMLMap<keyof StyleObject>>
  >([
    'align',
    'axis',
    'background',
    'backgroundColor',
    'border',
    'borderColor',
    'borderRadius',
    'borderWidth',
    'boxShadow',
    'boxSizing',
    'color',
    'contentSize',
    'display',
    'float',
    'flex',
    'flexFlow',
    'fontColor',
    'fontSize',
    'fontFamily',
    'fontStyle',
    'fontWeight',
    'height',
    'width',
    'isHidden',
    'justifyContent',
    'left',
    'letterSpacing',
    'lineHeight',
    'marginLeft',
    'marginTop',
    'marginRight',
    'marginBottom',
    'minWidth',
    'maxWidth',
    'minHeight',
    'maxHeight',
    'outline',
    'padding',
    'paddingTop',
    'paddingLeft',
    'paddingRight',
    'paddingBottom',
    'position',
    'required',
    'shadow',
    'textAlign',
    'textColor',
    'textDecoration',
    'textIndent',
    'top',
    'zIndex',
  ]),
  ymlNode: (node: unknown) => {
    if (node !== null && typeof node === 'object') {
      return y.isNode(node) || y.isPair(node) || y.isDocument(node)
    }
    return false
  },
}

export default is

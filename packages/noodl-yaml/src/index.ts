import 'is-proxy'
export { default as createFileSystem } from './utils/fileSystem'
export { default as DocDiagnostics } from './DocDiagnostics'
export { default as DocRoot } from './DocRoot'
export { default as DocVisitor } from './DocVisitor'
export { default as deref } from './utils/deref'
export { default as get } from './utils/get'
export { default as has } from './utils/has'
export { default as set } from './utils/set'
export { default as getJsType } from './utils/getJsType'
export { default as getNodeType } from './utils/getNodeType'
export { default as getYamlNodeKind } from './utils/getYamlNodeKind'
export { default as is } from './utils/is'
export { default as merge } from './transformers/merge'
export { default as replace } from './transformers/replace'
export { default as if } from './transformers/if'
export { default as unwrap } from './utils/unwrap'
export { toDoc, toJson, toYml } from './utils/yaml'
export * from './asserters'
export * from './assert'
export * from './create-proxy'
export * from './transform'
export * from './utils/normalize-deep'
// export * from './machine'
export * from './types'
export * as factory from './factory'

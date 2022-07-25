import y from 'yaml'
import getNodeType from './getNodeType'

function getJsType(node: unknown) {
  switch (getNodeType(node)) {
    case 'Map':
    case 'Document':
      return 'object'
    case 'Scalar': {
      const type = typeof (node as y.Scalar).value
      switch (type) {
        case 'boolean':
        case 'function':
        case 'undefined':
        case 'number':
        case 'string':
          return type
      }
      break
    }
    case 'Seq':
      return 'array'
    default:
      return null
  }
}

export default getJsType

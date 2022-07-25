import * as c from '../constants'
import getNodeType from './getNodeType'

function getYamlNodeKind(node: unknown) {
  switch (getNodeType(node)) {
    case 'Scalar':
      return c.Kind.Scalar
    case 'Pair':
      return c.Kind.Pair
    case 'Map':
      return c.Kind.Map
    case 'Seq':
      return c.Kind.Seq
    case 'Document':
      return c.Kind.Document
    default:
      return c.Kind.Unknown
  }
}

export default getYamlNodeKind

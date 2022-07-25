import y from 'yaml'

function getNodeType(node: y.Scalar): 'Scalar'
function getNodeType(node: y.Pair): 'Pair'
function getNodeType(node: y.YAMLMap): 'Map'
function getNodeType(node: y.YAMLSeq): 'Seq'
function getNodeType(node: y.Document | y.Document.Parsed): 'Document'
function getNodeType(
  node: unknown,
): 'Document' | 'Map' | 'Pair' | 'Scalar' | 'Seq' | 'unknown'
function getNodeType(node: unknown) {
  if (y.isScalar(node)) return 'Scalar'
  if (y.isPair(node)) return 'Pair'
  if (y.isMap(node)) return 'Map'
  if (y.isSeq(node)) return 'Seq'
  if (y.isDocument(node)) return 'Document'
  return 'unknown'
}

export default getNodeType

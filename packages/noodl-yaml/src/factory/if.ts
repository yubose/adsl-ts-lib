import y from 'yaml'
import { fp, is as coreIs } from 'noodl-core'
import { isMap, isPair, isScalar, isSeq } from '../utils/yaml'
import createNode from '../utils/createNode'
import type { If } from '../types'

function createIf(arg1?: any[] | Record<string, any> | y.YAMLMap | y.YAMLSeq) {
  let node: y.YAMLMap | undefined

  if (isMap(arg1)) {
    // node = arg1
  } else if (isSeq(arg1)) {
    // node = new y.YAMLMap()
  } else if (coreIs.arr(arg1)) {
    //
  } else if (coreIs.obj(arg1)) {
    //
  }

  if (!node) {
    node = createNode({ if: [undefined, undefined, undefined] })
  }

  return node as If
}

export default createIf

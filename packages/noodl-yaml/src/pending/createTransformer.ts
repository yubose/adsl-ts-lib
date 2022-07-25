import y from 'yaml'
// import _emit from './transformers/emit'
// import _eval from './transformers/eval'
import flowRight from 'lodash/flowRight'
import _if from '../transformers/if'
import _merge from '../transformers/merge'
import _replace from '../transformers/replace'
import { Kind, MapKind, ScalarKind, SeqKind } from '../constants'
import * as t from '../types'

function createTransformer(
  ...fns: ((
    args: t.AssertFnArgs<any>,
  ) => ReturnType<t.AssertFn<any>> | t.YAMLNode)[]
) {
  const composedTransformers = flowRight(...fns)
  // const composedTransformers = fns.reduceRight(
  //   (acc, fn) => (args) => acc(fn(args.node)),
  //   (args) => args.node,
  // )
  return function transform(node: unknown) {
    if (y.isScalar(node)) {
      //
    }
  }
}

export default createTransformer

import y from 'yaml'
import is from '../utils/is'
import unwrap from '../utils/unwrap'

export type If = y.YAMLMap<'if'>

export function unwrapIf(node: If) {
  const value = node.get('if')
  let unwrapped: [any, any, any]

  if (is.seqNode(value)) {
    unwrapped = [value.get(0, false), value.get(1, false), value.get(2, false)]
  } else {
    unwrapped = (value as [any, any, any]).slice(0, 3) as typeof unwrapped
  }

  return unwrapped
}

function transformIf(node: If) {
  const [cond, valTrue, valFalse] = unwrapIf(node)

  if (typeof cond === 'function') {
    return cond() ? valTrue : valFalse
  }

  if (is.scalarNode(cond)) {
    return cond.value ? valTrue : valFalse
  }

  if (is.pairNode(cond)) {
    return unwrap(cond.value) ? valTrue : valFalse
  }

  return cond ? valTrue : valFalse
}

export default transformIf

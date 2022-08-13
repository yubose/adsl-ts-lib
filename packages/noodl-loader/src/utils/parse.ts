import y from 'yaml'
import * as nt from 'noodl-types'
import regex from '../internal/regex'

export function builtInFn(value: y.YAMLMap<nt.BuiltInEvalReference<string>>) {
  const key = value.items[0].key?.toString?.() || ''
  const path = key
    .substring(2)
    .split('.')
    .map((value) => {
      return {
        value,
      }
    })
  const props = value.get(key as `=.builtIn${string}`)
  if (y.isMap(props)) {
    const dataIn = props.get('dataIn')
    const dataOut = props.get('dataOut')
  }
}

export function keyPair(value: y.Pair) {
  const key = noodlKey(value.key)
}

export function noodlKey(value: unknown) {
  if (y.isScalar(value)) {
    //
  }
  //
}

export function noodlValue() {
  //
}

export function listPlaceholders(str: string) {
  return (str.match(new RegExp(regex.placeholder.source, 'g')) || []).map(
    (placeholder) => placeholder.replace(/\$|{|}/g, ''),
  )
}

export function hasPlaceholder(str: string) {
  return regex.placeholder.test(str)
}

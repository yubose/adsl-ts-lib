import y from 'yaml'
import { fp, is as coreIs } from 'noodl-core'
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

export function getPlaceholderValues(str: string, values: any) {
  const placeholders = {} as Record<string, any>
  const keys = listPlaceholders(str)
  if (!keys.length) return placeholders
  keys.forEach((key) => (placeholders[key] = values[key]))
  return placeholders
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

import type { NameField, ReferenceString } from '../ecosTypes'

export function exists(v: unknown) {
  return !isNil(v)
}

export function hasNameField<
  O extends Record<string, any> = Record<string, any>,
>(v: O | undefined): v is O & { name: NameField } {
  return isObj(v) && 'name' in v && isObj(v.name)
}

export function isArr(v: unknown): v is any[] {
  return Array.isArray(v)
}

export function isBool(value: unknown): value is Boolean {
  return typeof value === 'boolean'
}

export function isNil(v: unknown) {
  return v === null || typeof v === 'undefined'
}

export function isObj(value: unknown): value is Record<string, any> {
  return value != null && !isArr(value) && typeof value === 'object'
}

export function isJson(s = '') {
  return s.endsWith('.json')
}

export function isNum(v: unknown): v is number {
  return typeof v === 'number'
}

export function isStr(v: unknown): v is string {
  return typeof v === 'string'
}

export const Regex = (function () {
  const o = {
    onlyNumbers: /^[\+\-]?\d*\.?\d+(?:[Ee][\+\-]?\d+)?$/,
    reference: {
      dot: {
        single: {
          root: /(^\.[A-Z])/,
          localRoot: /(^\.[a-z])/,
        },
        double: {
          root: /(^\.\.[A-Z])/,
          localRoot: /(^\.\.[a-z])/,
        },
      },
    },
  }
  return o
})()

export function trimReference<S extends ReferenceString>(v: S) {
  return v.replace(/^[.=@]+/i, '').replace(/[.=@]+$/i, '') || ''
}

/**
 * Functional programming utilities
 */
import { hasLetter } from '..'
import type { Path } from '../types'
import { arr, fnc, nil, num, obj, str, und } from './is'

/** @internal */
export function assign<O extends Record<string, any>>(v: O, ...rest: any[]) {
  return Object.assign(v, ...rest)
}

export function binary(fn: (...args: any[]) => any) {
  return (...args: any[]) => fn(args[0], args[1])
}

/** @internal */
export function entries<O extends Record<string, any>>(v: O) {
  return Object.entries(v !== null && typeof v === 'object' ? v : {}) as [
    key: keyof O,
    value: O[keyof O],
  ][]
}

/** @internal */
export function eq<T>(a: T, b: T) {
  return a === b
}

/**
 * Compare the equality of two strings using a case-sensitive ordinal comparison.
 * Case-sensitive comparisons compare both strings one code-point at a time using the integer value of each code-point.
 */
export function equateStringsCaseSensitive(a: string, b: string) {
  return eq(a, b)
}

/**
 * Compare the equality of two strings using a case-sensitive ordinal comparison.
 *
 * Case-sensitive comparisons compare both strings one code-point at a time using the integer
 * value of each code-point after applying `toUpperCase` to each string. We always map both
 * strings to their upper-case form as some unicode characters do not properly round-trip to
 * lowercase (such as `ẞ` (German sharp capital s)).
 */
export function equateStringsCaseInsensitive(a: string, b: string) {
  return a === b || (!und(a) && !und(b) && a.toUpperCase() === b.toUpperCase())
}

/**
 * Removes a keyword from the string
 * @example
 * ```js
 * const iteratorVar = 'itemObject'
 * const dataKey = 'itemObject.color'
 * const result = excludeStr(dataKey, iteratorVar) // "color"
 * ```
 * @internal
 * @param value String to manipulate
 * @param strToExclude String to remove
 * @returns The string result
 */
export function excludeStr(value: string, strToExclude: string) {
  if (!str(value)) return value
  if (value === strToExclude) return ''
  if (strToExclude && str(strToExclude) && value.includes(strToExclude)) {
    const sep = `${strToExclude}.`
    return value.split(sep).join('').replace(strToExclude, '')
  }
  return value
}

/** @internal */
export function each<A extends any[]>(
  a: A,
  fn: (v: A[number], i: number, collection: A) => void,
) {
  if (arr(a)) a.forEach((item, i, collection) => fn(item, i, collection))
}

/**
 * Retrieves a value in obj using path
 * @internal
 * @param { Record<string, any> | any[] } value
 * @param { Path[number] | Path } path
 * @returns { any }
 */
export function get(value: any, path: Path | Path[number]): any {
  let _index = 0
  let _path = toPath(path)
  let _len = _path.length

  while (value != null && _index < _len) {
    let nextKey = _path[_index++]
    let nextKeyPath = toPath(nextKey) || []
    let key = (nextKeyPath?.join?.('.') || '') as keyof typeof value
    value = value[key]
  }

  return _index && _index == _len ? value : undefined
}

export function has(value: any, path: Path | Path[number]) {
  if (obj(value) && path) {
    const paths = arr(path) ? path : String(path).split('.')
    if (paths.length === 1) return paths[0] in value
    const nextKey = paths.shift()
    if (nextKey) return has(value[nextKey as string], paths)
  }
  return false
}

/**
 * @internal
 * Returns true if there is a decimal in the number.
 * @param { number } value - Value to evaluate
 */
export function hasDecimal(value: any): boolean {
  return Number(value) % 1 !== 0
}

/**
 * @internal
 * Returns its argument
 *  */
export function identity<T>(x: T) {
  return x
}

/** @internal */
export function merge<O = any>(value: O, ...rest: any[]): any {
  if (obj(value)) {
    rest.forEach((o) => {
      if (obj(o)) {
        Object.entries(o).forEach(([k, v]) => {
          o[k] = obj(v) ? merge(o[k], v) : v
        })
      }
    })
  }
  return value
}

/** @internal */
export function omit<O extends Record<string, any>, K extends keyof O>(
  value: O | null | undefined,
  keys: K | K[],
) {
  if (nil(value)) return value
  value = { ...value } as O
  keys = toArr(keys)
  if (obj(value)) for (const key of keys) delete value[key]
  return value as Omit<O, K>
}

export function or(cond: any, t: any, f: any) {
  return (fnc(cond) ? cond() : cond) ? t : f
}

export function partial(fn: (...args: any[]) => any, ...args1: any[]) {
  return (...args2: any[]) => fn(...args1, ...args2)
}

export function partialR(fn: (...args: any[]) => any, ...args1: any[]) {
  return (...args2: any[]) => fn(...args2, ...args1)
}

/**
 * Syntactic sugar for toPath
 * @param args String or array of strings
 * @returns The converted path
 */
export function path(...args: Parameters<typeof toPath>) {
  return toPath(...args)
}

/**
 * @internal
 * @param value Object
 * @param key Key or keys to pick from value
 */
export function pick<O extends Record<string, any>, K extends keyof O>(
  value: O,
  key: K | K[],
) {
  const result = {} as O

  if (value !== null && typeof value === 'object') {
    key = toArr(key)

    for (const [k, v] of entries(value)) {
      if (key.includes(k as any)) result[k] = v
    }
  }

  return result
}

export function set(o: any, key: Path | number | string | symbol, value?: any) {
  if (arr(o) || obj(o)) {
    const path = toPath(key as Path)
    if (path.length === 1) {
      o[path[0]] = value
    } else {
      const nextKey = path.shift()
      if (nextKey) {
        set(o[nextKey], path, value)
      }
    }
  }
}

/**
 * Returns true if at least one value exists in an array
 * If a predicate function is provided it will return true if at least one call returns true
 * @internal
 * @param array
 * @param predicate Optional function to use as a predicate
 */
export function some<T>(array: T[] | undefined): array is T[]
export function some<T>(
  array: T[] | undefined,
  predicate: (value: T) => boolean,
): boolean
export function some<T>(
  array: T[] | undefined,
  predicate?: (value: T) => boolean,
): boolean {
  if (array) {
    if (predicate) {
      for (const v of array) if (predicate(v)) return true
    } else {
      return array.length > 0
    }
  }
  return false
}

/** @internal */
export function spread(fn: (k: string, v: any) => any) {
  return function onSpread([key, value]) {
    return fn(key, value)
  }
}

/**
 * Wraps a value into an array if it isn't already enclosed in one
 * @internal
 * @param v Value
 * @returns The value wrapped in an array (if it was not already wrapped)
 */
export function toArr<V>(v: V) {
  return (Array.isArray(v) ? v : [v]) as V extends any[] ? V : V[]
}

function toFixed(value: number, fixNum?: number) {
  return num(fixNum) ? value.toFixed(fixNum) : value
}

/**
 * Converts a value to a path if it isn't already a path
 * @param key
 * @returns The path
 */
export function toPath(key = '' as Path | Path[number]) {
  return (
    arr(key)
      ? key
      : str(key)
      ? key.split('.')
      : toArr(key as any).filter((fn) => !und(fn))
  ) as string[]
}

/**
 * Converts a value to a number
 * https://tc39.es/ecma262/#sec-tonumber
 * @internal
 */
export function toNum(value: unknown, fixedNum?: number) {
  if (num(value)) return Number(toFixed(Number(value), fixedNum))
  else if (str(value)) {
    return Number(toFixed(Number(value.replace(/[a-zA-Z]/gi, '')), fixedNum))
  }
  return Number(value)
}

export function toStr(value: unknown): string {
  return str(value) ? value : String(value)
}

export function toPx(value: unknown) {
  if (str(value)) {
    if (!hasLetter(value)) return `${value}px`
    return value
  }
  return `${value}px`
}

export function startsWith(value: string, str: string) {
  return value.startsWith(str)
}

/** @internal */
export function lowercase(str: string) {
  return str.toLowerCase()
}

/** @internal */
export function uppercase(str: string) {
  return str.toUpperCase()
}

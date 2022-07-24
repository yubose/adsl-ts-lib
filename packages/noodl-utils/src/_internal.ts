import { QueryObj } from './types'

export const array = <O extends any[], P extends O[number]>(o: P | P[]): P[] =>
  isArr(o) ? o : [o]
export const isArr = (v: any): v is any[] => Array.isArray(v)
export const isBool = (v: any): v is boolean => typeof v === 'boolean'
export const isObj = (v: any): v is Record<string, any> =>
  !!v && !isArr(v) && typeof v === 'object'
export const isNum = (v: any): v is number => typeof v === 'number'
export const isStr = (v: any): v is string => typeof v === 'string'
export const isUnd = (v: any): v is undefined => typeof v === 'undefined'
export const isFnc = <V extends (...args: any[]) => any>(v: any): v is V =>
  typeof v === 'function'

export const unwrapObj = (obj: QueryObj) => (isFnc(obj) ? obj() : obj)

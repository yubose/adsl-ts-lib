import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import get from 'lodash/get'
import type { NuiComponent } from '../types'

interface Duration {
  years?: number
  months?: number
  weeks?: number
  days?: number
  hours?: number
  minutes?: number
  seconds?: number
}

function toInteger(number: number | undefined) {
  if (typeof number !== 'number') number = Number(number)
  return number < 0 ? Math.ceil(number) : Math.floor(number)
}

export function addDate(dirtyDate: Date, duration: Duration): Date {
  if (!duration || typeof duration !== 'object') return new Date(NaN)

  const years = 'years' in duration ? toInteger(duration.years) : 0
  const months = 'months' in duration ? toInteger(duration.months) : 0
  const weeks = 'weeks' in duration ? toInteger(duration.weeks) : 0
  const days = 'days' in duration ? toInteger(duration.days) : 0
  const hours = 'hours' in duration ? toInteger(duration.hours) : 0
  const minutes = 'minutes' in duration ? toInteger(duration.minutes) : 0
  const seconds = 'seconds' in duration ? toInteger(duration.seconds) : 0

  // Add years and months
  const date = new Date(dirtyDate.getTime())
  const dateWithMonths =
    months || years ? addMonths(date, months + years * 12) : date

  // Add weeks and days
  const dateWithDays =
    days || weeks ? addDays(dateWithMonths, days + weeks * 7) : dateWithMonths

  // Add days, hours, minutes and seconds
  const minutesToAdd = minutes + hours * 60
  const secondsToAdd = seconds + minutesToAdd * 60
  const msToAdd = secondsToAdd * 1000
  const finalDate = new Date(dateWithDays.getTime() + msToAdd)

  return finalDate
}

/**
 * Taken from https://github.com/date-fns/date-fns/blob/2005427a6c50967d7b50830fb33e753bb2df39a8/src/addDays/index.ts#L27
 */
export function addDays(dirtyDate: Date, dirtyAmount: number): Date {
  const date = new Date(dirtyDate.getTime())
  const amount = toInteger(dirtyAmount)
  if (isNaN(amount)) return new Date(NaN)
  // If 0 days, no-op to avoid changing times in the hour before end of DST
  if (!amount) return date
  date.setDate(date.getDate() + amount)
  return date
}

/**
 * Taken from https://github.com/date-fns/date-fns/blob/2005427a6c50967d7b50830fb33e753bb2df39a8/src/addMonths/index.ts#L27
 */
export default function addMonths(dirtyDate: Date, dirtyAmount: number): Date {
  const date = new Date(dirtyDate.getTime())
  const amount = toInteger(dirtyAmount)
  if (isNaN(amount)) return new Date(NaN)
  // If 0 months, no-op to avoid changing times in the hour before end of DST
  if (!amount) return date
  const dayOfMonth = date.getDate()
  const endOfDesiredMonth = new Date(date.getTime())
  endOfDesiredMonth.setMonth(date.getMonth() + amount + 1, 0)
  const daysInMonth = endOfDesiredMonth.getDate()
  if (dayOfMonth >= daysInMonth) {
    return endOfDesiredMonth
  } else {
    date.setFullYear(
      endOfDesiredMonth.getFullYear(),
      endOfDesiredMonth.getMonth(),
      dayOfMonth,
    )
    return date
  }
}

export function createGlobalComponentId(
  component: NuiComponent.Instance | string | undefined,
) {
  return !u.isUnd(component)
    ? u.isStr(component)
      ? component
      : component.blueprint?.popUpView ||
        component.blueprint?.viewTag ||
        component.get('popUpView') ||
        component.get('viewTag') ||
        component.id ||
        ''
    : ''
}

/**
 * Returns a random 7-character string
 */
export function getRandomKey() {
  return `_${Math.random().toString(36).substr(2, 9)}`
}

// Convert the date to the start of the day
// https://github.com/date-fns/date-fns/blob/master/src/startOfDay/index.ts
export function getStartOfDay(dirtyDate: Date) {
  const date = new Date(dirtyDate.getTime())
  date.setHours(0, 0, 0, 0)
  return date
}

/**
 * Fallback "if" resolver if a custom resolver was not provided in hooks
 * @param ifObject
 * @returns
 */
export function defaultResolveIf(ifObject: nt.IfObject) {
  const [cond, valOnTrue, valOnFalse] = ifObject.if || []
  if (u.isFnc(cond)) return cond?.() ? valOnTrue : valOnFalse
  return cond ? valOnTrue : valOnFalse
}

export function resolveDataPath(datapath: string, rootKey?: string) {
  if (nt.Identify.rootKey(datapath)) {
    return nu.toDataPath(datapath)
  } else if (nt.Identify.localKey(datapath)) {
    return rootKey
      ? [rootKey, ...nu.toDataPath(datapath)]
      : nu.toDataPath(datapath)
  }
  return []
}

export function defaultResolveReference(
  root: Record<string, any> | (() => Record<string, any>),
  rootKey = '',
  reference: nt.ReferenceString,
) {
  const datapath = nu.trimReference(reference)
  if (nt.Identify.localKey(datapath)) {
    return get(
      u.isFnc(root) ? root() : root,
      resolveDataPath(datapath, rootKey),
    )
  }
  return get(u.isFnc(root) ? root() : root, nu.toDataPath(datapath))
}

export function safeMerge<O = any>(
  obj: Partial<O> & Record<string, any>,
  obj2: Partial<O> & Record<string, any>,
  ...value: any[]
) {
  if (u.isObj(obj)) {
    value.unshift(obj2)
    const result = {} as O
    value.forEach((val) => u.isObj(val) && u.merge(result, val))
    return result
  }
  if (u.isArr(obj)) {
    return [...obj, ...u.array(value)] as O extends any[] ? O : O
  }
  return obj
}

export function useFuncOrValue({
  fn,
  args,
  value,
}: {
  fn: any
  args?: any
  value?: any
}) {
  return u.isFnc(fn) ? fn(args) : value
}

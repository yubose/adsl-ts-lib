import curry from 'lodash/curry'
import type {
  ActionObject,
  ComponentObject,
  userEvent,
  UncommonActionObjectProps,
  UncommonComponentObjectProps,
} from 'noodl-types'
import * as u from '@jsmanifest/utils'
import type { NoodlObject } from 'noodl-builder'

export type ActionProps<C extends Partial<ActionObject> = ActionObject> =
  Partial<UncommonActionObjectProps> & C

export type ComponentProps<C extends Partial<ComponentObject>> = Partial<
  Record<keyof typeof userEvent, ActionObject[]>
> &
  Partial<UncommonComponentObjectProps> &
  C

export function createActionObject_next<
  T extends string,
  O extends ActionObject<T>,
>(actionType: T) {
  return (obj?: Partial<O>) => ({ ...obj, actionType } as O)
}

export function createActionObject<O extends ActionObject>(
  defaultProps: Partial<O>,
  key: keyof O,
) {
  return function (props?: string | ActionProps<O>): O {
    const obj = { ...(defaultProps as object) } as ActionObject
    if (u.isStr(key)) {
      if (u.isObj(props)) {
        if (key in props) u.assign(obj, props)
      } else obj[key as any] = props
    } else if (u.isObj(key)) {
      u.assign(obj, key)
    }
    u.isObj(props) && u.assign(obj, props)
    return obj as O
  }
}

export const createComponentObject_next = curry(
  <T extends string, O extends ComponentObject<T>>(componentType: T) =>
    (obj?: Partial<O>) =>
      ({ ...obj, type: componentType } as O),
)

export function createComponentObject<
  O extends ComponentObject,
  K extends keyof O = keyof O,
>(defaultProps: Partial<O>, key?: K) {
  return function create<P extends K | Partial<O>>(props?: P): O {
    const obj = { ...defaultProps } as ComponentObject
    if (u.isStr(key)) {
      if (u.isObj(props)) {
        if (key in props) u.assign(obj, props)
      } else obj[key] = props
    } else if (u.isObj(key)) {
      u.assign(obj, key)
    }
    u.isObj(props) && u.assign(obj, props)
    return obj as O
  }
}

export function mergeObject<
  O extends Record<string, any> = Record<string, any>,
>(obj: NoodlObject, props?: Record<string, any>): NoodlObject<O> {
  if (u.isObj(props)) {
    u.entries(props).forEach(([k, v]) => obj.createProperty(k, v))
  }
  return obj
}

export function mergeKeyValOrObj<
  O extends Record<string, any> = Record<string, any>,
>(
  obj: NoodlObject,
  keyOrObj: any,
  value?: any,
  otherProps?: any,
): NoodlObject<O> {
  if (u.isObj(keyOrObj)) {
    u.entries(keyOrObj).forEach(([k, v]) => obj.createProperty(k, v))
  } else if (u.isStr(keyOrObj)) {
    obj.createProperty(keyOrObj, value)
  }
  if (u.isObj(otherProps)) {
    u.entries(otherProps).forEach(([k, v]) => obj.createProperty(k, v))
  }
  return obj
}

export function objWithKeyOrUndef(obj: any, key: string) {
  return u.isObj(obj) && u.isStr(key) && key in obj ? obj[key] : undefined
}

export function strOrUndef(value: any) {
  return u.isStr(value) ? value : undefined
}
export function strOrEmptyStr(value: any) {
  return u.isStr(value) ? value : ''
}

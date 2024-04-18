import type { LiteralUnion } from 'type-fest'
import type { ReferenceString } from './ecosTypes'
import type { ActionObject } from './actionTypes'
import type { StyleObject } from './styleTypes'

export type ActionChain = (
  | ActionObject
  | EmitObjectFold
  | GotoObject
  | IfObject
)[]

export type BuiltInDataInDataOutObject<S extends string = string> = Record<
  `=.builtIn${S}`,
  { dataIn: any; dataOut: string }
>

export type BuiltInEmptyObject<S extends string = string> = Record<
  `=.builtIn${S}`,
  '' | null | undefined
>

export type ConfigKey = LiteralUnion<'aitmed', string>

export interface DesignSuffix {
  widthHeightRatioThreshold?: number
  greaterEqual?: string
  less?: string
}

export interface EmitObject {
  actions: any[]
  dataKey?: string | { [key: string]: string }
  [key: string]: any
}

export type EmitObjectFold<
  O extends Record<string, any> = Record<string, any>,
> = O & {
  emit: EmitObject
}

export type Extension = LiteralUnion<'yml', string>

export type FileSuffix = `.${string}`

export type FileName = `${string}.${Extension}`
export type PageName = string
export type Url = string

export type GotoUrl = string

export interface GotoObject<V = string> {
  goto: V
  [key: string]: any
}

export interface IfObject<Cond = any, VT = any, VF = any> {
  if: [Cond, VT, VF]
  [key: string]: any
}

export interface MinMaxObject {
  min: any
  max: any
}

export type Path<V = any> = V extends string
  ? string
  : V extends EmitObjectFold
  ? EmitObjectFold
  : V extends IfObject
  ? IfObject
  : EmitObjectFold | IfObject | string

export type Switch = Array<
  ReferenceString | { case: Array<string | ActionObject> }
>

export type TextBoardObject = (
  | { br?: '' | null }
  | { color?: string; text?: string }
)[]

export interface ToastObject {
  message?: string
  style?: StyleObject
}

export type Value =
  | any[]
  | Record<string, any>
  | ReferenceString
  | boolean
  | number
  | string
  | ''
  | null

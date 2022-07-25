import type { ActionObject } from './actionTypes'
import type { ContentType, EventType } from './constantTypes'
import type { ReferenceString } from './ecosTypes'
import type {
  StyleObject,
  StyleTextAlign,
  StyleTextAlignObject,
} from './styleTypes'
import type {
  ActionChain,
  EmitObject,
  EmitObjectFold,
  GotoObject,
  IfObject,
  Path,
  TextBoardObject,
} from './uncategorizedTypes'

export type UncommonComponentObjectProps = {
  [key in EventType]: ActionChain
} & {
  actions?: (ActionObject | EmitObject | GotoObject)[]
  audioStream?: boolean
  contentType?: ContentType
  chatItem?: Partial<ComponentObject>
  dataKey?: string | EmitObjectFold | IfObject
  ecosObj?: Record<string, any>
  emit?: EmitObject
  global?: true
  image?: string
  isEditable?: string | boolean
  iteratorVar?: string
  listObject?: '' | ReferenceString | any[]
  onEvent?: string
  optionKey?: string
  options?: '' | ReferenceString | any[]
  path?: Path
  pathSelected?: string
  placeholder?: string | EmitObjectFold | IfObject
  popUpView?: string
  poster?: string
  refresh?: boolean
  required?: string | boolean
  text?: string | EmitObjectFold | IfObject
  textBoard?: TextBoardObject
  textAlign?: StyleTextAlign | StyleTextAlignObject
  'text=func'?: string
  videoFormat?: string
  videoStream?: boolean
  [key: string]: any
}

export interface ComponentObject<T extends string = any>
  extends Partial<Record<EventType, ActionChain>> {
  type: T
  style?: StyleObject
  children?: any[]
  viewTag?: string
  [key: string]: any
}

export interface ChatListComponentObject
  extends ComponentObject,
    Pick<
      UncommonComponentObjectProps,
      'chatItem' | 'contentType' | 'iteratorVar' | 'listObject'
    > {
  type: 'chatList'
  [key: string]: any
}

export interface ChartComponentObject extends ComponentObject {
  type: 'chart'
  [key: string]: any
}

export interface ButtonComponentObject
  extends ComponentObject,
    Pick<UncommonComponentObjectProps, 'contentType' | 'text'> {
  type: 'button'
  [key: string]: any
}

export interface CanvasComponentObject
  extends ComponentObject,
    Pick<UncommonComponentObjectProps, 'dataKey'> {
  type: 'canvas'
  [key: string]: any
}

export interface DividerComponentObject extends ComponentObject {
  type: 'divider'
  [key: string]: any
}

export interface EcosDocComponentObject
  extends ComponentObject,
    Pick<UncommonComponentObjectProps, 'ecosObj'> {
  type: 'ecosDoc'
  [key: string]: any
}

export interface FooterComponentObject extends ComponentObject {
  type: 'footer'
  [key: string]: any
}

export interface HeaderComponentObject extends ComponentObject {
  type: 'header'
  [key: string]: any
}

export interface ImageComponentObject
  extends ComponentObject,
    Pick<
      UncommonComponentObjectProps,
      'contentType' | 'dataKey' | 'path' | 'pathSelected'
    > {
  type: 'image'
  [key: string]: any
}

export interface LabelComponentObject
  extends ComponentObject,
    Pick<
      UncommonComponentObjectProps,
      | 'contentType'
      | 'dataKey'
      | 'placeholder'
      | 'text'
      | 'textBoard'
      | 'text=func'
    > {
  type: 'label'
  [key: string]: any
}

export interface ListComponentObject
  extends ComponentObject,
    Pick<
      UncommonComponentObjectProps,
      'contentType' | 'iteratorVar' | 'listObject'
    > {
  type: 'list'
  [key: string]: any
}

export interface ListItemComponentObject extends ComponentObject {
  type: 'listItem'
  [key: string]: any
}

export interface MapComponentObject
  extends ComponentObject,
    Pick<UncommonComponentObjectProps, 'dataKey'> {
  type: 'map'
  [key: string]: any
}

export interface PageComponentObject
  extends ComponentObject,
    Pick<UncommonComponentObjectProps, 'path'> {
  type: 'page'
  [key: string]: any
}

export interface PluginComponentObject
  extends ComponentObject,
    Pick<UncommonComponentObjectProps, 'path'> {
  type: 'plugin'
  [key: string]: any
}

export interface PluginHeadComponentObject
  extends ComponentObject,
    Pick<UncommonComponentObjectProps, 'path'> {
  type: 'pluginHead'
  [key: string]: any
}

export interface PluginBodyTopComponentObject
  extends ComponentObject,
    Pick<UncommonComponentObjectProps, 'path'> {
  type: 'pluginBodyTop'
  [key: string]: any
}

export interface PluginBodyTailComponentObject
  extends ComponentObject,
    Pick<UncommonComponentObjectProps, 'path'> {
  type: 'pluginBodyTail'
  [key: string]: any
}

export interface PopUpComponentObject
  extends ComponentObject,
    Pick<UncommonComponentObjectProps, 'popUpView'> {
  type: 'popUp'
  [key: string]: any
}

export interface RegisterComponentObject
  extends ComponentObject,
    Pick<
      UncommonComponentObjectProps,
      'actions' | 'dataKey' | 'emit' | 'onEvent'
    > {
  type: 'register'
  [key: string]: any
}

export interface SelectComponentObject
  extends ComponentObject,
    Pick<
      UncommonComponentObjectProps,
      'contentType' | 'optionKey' | 'options' | 'placeholder' | 'required'
    > {
  type: 'select'
  [key: string]: any
}

export interface ScrollViewComponentObject extends ComponentObject {
  type: 'scrollView'
  [key: string]: any
}

export interface TextFieldComponentObject
  extends ComponentObject,
    Pick<
      UncommonComponentObjectProps,
      'contentType' | 'dataKey' | 'placeholder' | 'required'
    > {
  type: 'textField'
  [key: string]: any
}

export interface TextViewComponentObject
  extends ComponentObject,
    Pick<
      UncommonComponentObjectProps,
      'contentType' | 'dataKey' | 'isEditable' | 'placeholder' | 'required'
    > {
  type: 'textView'
  [key: string]: any
}

export interface VideoComponentObject
  extends ComponentObject,
    Pick<UncommonComponentObjectProps, 'path' | 'poster' | 'videoFormat'> {
  type: 'video'
  [key: string]: any
}

export interface ViewComponentObject extends ComponentObject {
  type: 'view'
  [key: string]: any
}

/* -------------------------------------------------------
	---- Other component props
-------------------------------------------------------- */

export type PageComponentUrl<S extends string = string> =
  S extends `${string}@${string}#${string}` ? S : string

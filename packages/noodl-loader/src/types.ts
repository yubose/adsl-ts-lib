import type fs from 'fs'
import y from 'yaml'

export type As = 'doc' | 'json' | 'yml'
export type LoadType = 'file' | 'url'
export type ParsedAs<A extends As = 'yml'> = A extends 'doc'
  ? y.Document<y.Node<any>>
  : A extends 'json'
  ? Record<string, any>
  : string

export type BaseRootKey =
  | 'BaseCSS'
  | 'BaseDataModel'
  | 'BasePage'
  | 'Config'
  | 'Global'

export type Encoding = Extract<fs.EncodingOption, string>

export namespace Ext {
  export type Image = 'bmp' | 'gif' | 'jpeg' | 'jpg' | 'png' | 'webp'
  export type Json = 'json'
  export type Pdf = 'pdf'
  export type Script = 'js'
  export type Text = 'css' | 'html' | 'txt'
  export type Video = 'avi' | 'flac' | 'mkv' | 'mp4' | 'mpeg' | 'mpg'
}

export type KeyOfCadlEndpoint =
  | 'assetsUrl'
  | 'baseUrl'
  | 'fileSuffix'
  | 'languageSuffix'
  | 'preload'
  | 'page'
  | 'startPage'

export type KeyOfConfig =
  | 'apiHost'
  | 'apiPort'
  | 'webApiHost'
  | 'appApiHost'
  | 'cadlBaseUrl'
  | 'cadlMain'
  | 'connectiontimeout'
  | 'debug'
  | 'viewWidthHeightRatio'
  | 'web'
  | 'ios'
  | 'android'
  | 'timestamp'
  | 'myBaseUrl'
  | 'keywords'

export type YAMLNode = y.Document | y.Node<any> | y.Pair

export type NoodlYAMLNode = YAMLNode | boolean | number | string | null

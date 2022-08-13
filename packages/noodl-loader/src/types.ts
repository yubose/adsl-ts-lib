import y from 'yaml'

export type BaseRootKey =
  | 'BaseCSS'
  | 'BaseDataModel'
  | 'BasePage'
  | 'Config'
  | 'Global'

export namespace Ext {
  export type Image = 'bmp' | 'gif' | 'jpeg' | 'jpg' | 'png' | 'webp'
  export type Json = 'json'
  export type Pdf = 'pdf'
  export type Script = 'js'
  export type Text = 'css' | 'html' | 'txt'
  export type Video = 'avi' | 'flac' | 'mkv' | 'mp4' | 'mpeg' | 'mpg'
}

export type YAMLNode = y.Document | y.Node<any> | y.Pair

export type NoodlYAMLNode = YAMLNode | boolean | number | string | null

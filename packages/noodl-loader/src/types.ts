import y from 'yaml'
import type Config from './Config'
import type CadlEndpoint from './CadlEndpoint'
import type LoaderStrategy from './Loader/Strategy'

type OrArray<V> = V | V[]

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

export abstract class ALoader {
  abstract load(...args: any[]): Promise<any> | any
  strategies: LoaderStrategy[] = []
}

export interface LoaderCommonOptions {
  config: Config
  cadlEndpoint: CadlEndpoint
  root: Record<string, any>
}

export type LoadType = 'doc' | 'json' | 'yml'
export type LoadFilesAs = 'list' | 'map' | 'object'

export interface LoadFilesOptions<
  LType extends LoadType = 'yml',
  LFType extends LoadFilesAs = 'list',
> {
  as?: LFType
  includeExt?: boolean
  preload?: OrArray<string>
  spread?: OrArray<string>
  type?: LType
}

export type YAMLNode = y.Document | y.Node<any> | y.Pair

export type NoodlYAMLNode = YAMLNode | boolean | number | string | null

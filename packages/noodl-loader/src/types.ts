import type { LiteralUnion } from 'type-fest'
import type { createFileSystem } from 'noodl-file'
import y from 'yaml'
import * as nt from 'noodl-types'
import type Config from './Config'
import type CadlEndpoint from './CadlEndpoint'
import * as c from './constants'

type OrArray<V> = V | V[]

export abstract class AExtractor<INode = any> {
  abstract extract<R = any>(
    cb: (name: string, node: INode, utils: AExtractor['fs']) => any,
  ): R[]
  abstract fs: ReturnType<typeof createFileSystem> | undefined
  abstract use(
    value: AStructure | AVisitor | Parameters<typeof createFileSystem>[0],
  ): this
}

export abstract class AVisitor {
  abstract visit(name: string, node: any): any
  abstract use(
    callback: (args: {
      name?: string
      key: any
      value: any
      path: any[]
    }) => any,
  ): this
}

export namespace Ext {
  export type Image = 'bmp' | 'gif' | 'jpeg' | 'jpg' | 'png' | 'webp'
  export type Script = 'js'
  export type Text = 'css' | 'html' | 'txt'
  export type Video = 'avi' | 'flac' | 'mkv' | 'mp4' | 'mpeg' | 'mpg'
}

export interface IAccumulator<V = any> {
  value: V
}

export abstract class ALoader {
  abstract root: Record<string, any>
  abstract load(...args: any[]): Promise<any> | any
}

export abstract class ALoaderStrategy {
  abstract is(value: any): boolean
  abstract load(
    value: any,
    options: Pick<LoaderCommonOptions, 'config' | 'root'> & Record<string, any>,
  ):
    | Promise<{ config: string; cadlEndpoint?: string }>
    | { config: string; cadlEndpoint?: string }
}

export interface LoaderCommonOptions {
  config: Config
  cadlEndpoint: CadlEndpoint
  root: ALoader['root']
}

export namespace Loader {
  export type CommonEmitEvents =
    | typeof c.appBaseUrlPurged
    | typeof c.appConfigParsed
    | typeof c.appEndpointPurged
    | typeof c.appPageRetrieved
    | typeof c.configVersionSet
    | typeof c.rootBaseUrlPurged
    | typeof c.rootConfigRetrieved

  export type Hooks = {
    [c.rootConfigRetrieved](options: {
      rootConfig: nt.RootConfig
      yml: string
    }): void
    [c.appConfigParsed]<T extends Loader.RootDataType>(args: {
      name: string
      appConfig: T extends 'map' ? y.Document : nt.AppConfig
    }): void
    [c.appPageNotFound](options: {
      appKey: string
      error: Error
      pageName: string
      url?: string
    }): void
    [c.configKeySet](configKey: string): void
    [c.configVersionSet](
      configVersion: LiteralUnion<'latest', number | string>,
    ): void
    [c.placeholderPurged](args: { before: string; after: string }): void
    [c.rootConfigIsBeingRetrieved]<T extends Loader.RootDataType>(args: {
      configKey: string
      configUrl: string
    }): void
    [c.rootConfigRetrieved]<T extends Loader.RootDataType>(args: {
      rootConfig: T extends 'map' ? y.Document : nt.RootConfig
      url: string
      yml: string
    }): void
    [c.appConfigIsBeingRetrieved]<T extends Loader.RootDataType>(args: {
      rootConfig: T extends 'map' ? y.Document : nt.RootConfig
      appKey: string
      url: string
    }): void
    [c.appConfigRetrieved]<T extends Loader.RootDataType>(args: {
      appKey: string
      appConfig: T extends 'map' ? y.Document : nt.AppConfig
      rootConfig: T extends 'map' ? y.Document : nt.RootConfig
      yml: string
      url: string
    }): void
    [c.appPageRetrieved]<T extends Loader.RootDataType>(args: {
      fromDir?: boolean
      pageName: string
      pageObject: T extends 'map' ? y.Document : nt.PageObject
      url?: string
    }): void
    [c.appPageRetrieveFailed](args: { error: Error; pageName: string }): void
  }

  export type LoadOptions<Type extends 'doc' | 'yml' = 'doc' | 'yml'> =
    | string
    | (Type extends 'doc'
        ? OrArray<{ name: string; doc: y.Document }>
        : OrArray<{ name: string; yml: string }>)

  export interface Options<
    ConfigKey extends string = string,
    DataType extends Loader.RootDataType = 'map',
  > {
    config?: ConfigKey
    dataType?: DataType
    deviceType?: nt.DeviceType
    env?: nt.Env
    loglevel?: 'debug' | 'error' | 'http' | 'info' | 'verbose' | 'warn'
    version?: LiteralUnion<'latest', string>
  }

  export type BaseRootKey =
    | 'BaseCSS'
    | 'BaseDataModel'
    | 'BasePage'
    | 'Config'
    | 'Global'

  export type RootMap = Map<
    LiteralUnion<BaseRootKey, string>,
    y.Document | y.Node
  > & {
    toJSON(): Record<string, any>
  }

  export type RootObject = Record<LiteralUnion<BaseRootKey, string>, any>

  export type Root<DataType extends RootDataType = 'map'> =
    DataType extends 'object' ? RootObject : RootMap

  export type RootDataType = 'map' | 'object'
}

export abstract class AStructure<Struct extends IStructure = IStructure> {
  abstract name: string
  abstract is(node: any): boolean
  abstract createStructure(node: any): Struct
}

export interface IStructure<S extends string = string> {
  raw: any
  group: S
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

export type LoadOptions<Type extends 'doc' | 'yml' = 'doc' | 'yml'> =
  | string
  | (Type extends 'doc'
      ? OrArray<{ name: string; doc: y.Document }>
      : OrArray<{ name: string; yml: string }>)

export interface Options<
  ConfigKey extends string = string,
  DataType extends Loader.RootDataType = 'map',
> {
  config?: ConfigKey
  dataType?: DataType
  deviceType?: nt.DeviceType
  env?: nt.Env
  loglevel?: 'debug' | 'error' | 'http' | 'info' | 'verbose' | 'warn'
  version?: LiteralUnion<'latest', string>
}

export interface MetaObject<N = any> {
  _node?: N
  key?: string
  value?: any
  length?: number
  keys?: string[]
  isReference?: boolean
  isRootKey?: boolean
}

export type Hooks = {
  [c.rootConfigRetrieved](options: {
    rootConfig: nt.RootConfig
    yml: string
  }): void
  [c.appConfigParsed]<T extends Loader.RootDataType>(args: {
    name: string
    appConfig: T extends 'map' ? y.Document : nt.AppConfig
  }): void
  [c.appPageNotFound](options: {
    appKey: string
    error: Error
    pageName: string
    url?: string
  }): void
  [c.configKeySet](configKey: string): void
  [c.configVersionSet](
    configVersion: LiteralUnion<'latest', number | string>,
  ): void
  [c.placeholderPurged](args: { before: string; after: string }): void
  [c.rootConfigIsBeingRetrieved]<T extends Loader.RootDataType>(args: {
    configKey: string
    configUrl: string
  }): void
  [c.rootConfigRetrieved]<T extends Loader.RootDataType>(args: {
    rootConfig: T extends 'map' ? y.Document : nt.RootConfig
    url: string
    yml: string
  }): void
  [c.appConfigIsBeingRetrieved]<T extends Loader.RootDataType>(args: {
    rootConfig: T extends 'map' ? y.Document : nt.RootConfig
    appKey: string
    url: string
  }): void
  [c.appConfigRetrieved]<T extends Loader.RootDataType>(args: {
    appKey: string
    appConfig: T extends 'map' ? y.Document : nt.AppConfig
    rootConfig: T extends 'map' ? y.Document : nt.RootConfig
    yml: string
    url: string
  }): void
  [c.appPageRetrieved]<T extends Loader.RootDataType>(args: {
    fromDir?: boolean
    pageName: string
    pageObject: T extends 'map' ? y.Document : nt.PageObject
    url?: string
  }): void
  [c.appPageRetrieveFailed](args: { error: Error; pageName: string }): void
}

export type YAMLNode =
  | y.Document
  | y.Document.Parsed
  | y.Node
  | y.YAMLMap
  | y.YAMLSeq

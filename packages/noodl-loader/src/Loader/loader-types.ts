import type Config from '../config'
import type CadlEndpoint from '../cadlendpoint'
import type Strategy from './strategy'

export abstract class AbstractLoader {
  abstract load(...args: any[]): Promise<any> | any
  strategies: Strategy[] = []
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
  preload?: string | string[]
  spread?: string | string[]
  type?: LType
}

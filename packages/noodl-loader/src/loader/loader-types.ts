import type Config from '../config'
import type CadlEndpoint from '../cadlendpoint'

export abstract class AbstractLoader {
  abstract load(...args: any[]): Promise<any> | any
}

export interface LoaderCommonOptions {
  config: Config
  cadlEndpoint: CadlEndpoint
  root: Record<string, any>
}

export type LoadType = 'file' | 'url'

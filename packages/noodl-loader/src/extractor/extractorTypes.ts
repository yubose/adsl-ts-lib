import type { LiteralUnion } from 'type-fest'
import type NoodlLoader from '../Loader'
import type y from 'yaml'
import type Asset from './Asset'
import { ExtractType } from '../constants'

export type ExtractAssetPreset =
  | 'config'
  | 'cadlEndpoint'
  | 'documents'
  | 'images'
  | 'pages'
  | 'scripts'
  | 'videos'

export interface ExtractFn<N = unknown> {
  (
    key: Parameters<y.visitorFn<N>>[0],
    node: Parameters<y.visitorFn<N>>[1],
    path: Parameters<y.visitorFn<N>>[2],
    options: ExtractFnOptions,
  ): ReturnType<y.visitorFn<N>> | { type: string; data?: any }
}

export interface ExtractFnOptions
  extends Partial<Pick<NoodlLoader, 'config' | 'cadlEndpoint' | 'root'>> {
  assets: Asset[]
  assetsUrl?: string
  baseUrl?: string
  control: {
    BREAK: symbol
    REMOVE: symbol
    SKIP: symbol
  }
  createAsset(
    propsOrType:
      | LiteralUnion<ExtractType, string>
      | Asset
      | {
          type?: LiteralUnion<ExtractType, string>
          id?: string
          props?: Record<string, any>
        },
    props?: Asset | Record<string, any>,
  ): Asset
  state: {
    assets: Asset[]
    assetIds: string[]
  } & Record<string, any>
}

export type ExtractedAssetsArray = Asset[]
export type ExtractedAssetsObject = Record<string, Asset>
export type ExtractReturnValue<As extends 'array' | 'object' = 'array'> =
  As extends 'array' ? Asset[] : Record<string, Asset>

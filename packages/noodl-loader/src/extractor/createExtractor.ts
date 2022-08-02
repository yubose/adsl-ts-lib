import * as u from '@jsmanifest/utils'
import { visitAsync } from 'yaml'
import Asset from './Asset'
import extractDocuments from './presets/extractDocuments'
import extractImages from './presets/extractImages'
import extractPages from './presets/extractPages'
import extractScripts from './presets/extractScripts'
import extractVideos from './presets/extractVideos'
import { isNode, isPair, visit } from '../internal/yaml'
import { replacePlaceholders } from '../utils/replace'
import type NoodlLoader from '../Loader'
import type { YAMLNode } from '../types'
import * as c from '../constants'
import * as t from './extractorTypes'

export interface CreateExtractorOptions {
  //
}

function createExtractor() {
  const { BREAK, REMOVE, SKIP } = visit

  async function extract<As extends 'array' | 'object' = 'array'>(
    value: YAMLNode,
    {
      // @ts-expect-error
      as = 'array',
      config,
      cadlEndpoint,
      include,
      prepareState,
      root,
      use: useProp = [],
    }: Partial<Pick<NoodlLoader, 'cadlEndpoint' | 'config' | 'root'>> & {
      as?: As
      include?: t.ExtractAssetPreset | t.ExtractAssetPreset[] | 'any'
      prepareState?: (
        state: Record<string, any>,
      ) => Record<string, any> | undefined | void
      use?:
        | t.ExtractFn
        | { extract: t.ExtractFn; once?: boolean }
        | (t.ExtractFn | { extract: t.ExtractFn; once?: boolean })[]
    } = {},
  ): Promise<t.ExtractReturnValue<As>> {
    if (isPair(value)) {
      if (isNode(value.value)) {
        value = value.value
      } else {
        throw new Error(
          `The value ${value.value} is not a compatible node to visit`,
        )
      }
    }

    const use = [...u.array(useProp)] as (
      | t.ExtractFn
      | { extract: t.ExtractFn; once?: boolean }
    )[]

    for (const preset of u.array(include)) {
      if (preset === 'any') {
        use.length = 0
        use.push(
          extractDocuments,
          extractImages,
          extractPages,
          extractScripts,
          extractVideos,
        )
        break
      } else if (preset === 'documents') {
        use.push(extractDocuments)
      } else if (preset === 'images') {
        use.push(extractImages)
      } else if (preset === 'pages') {
        use.push({ extract: extractPages, once: true })
      } else if (preset === 'scripts') {
        use.push(extractScripts)
      } else if (preset === 'videos') {
        use.push(extractVideos)
      }
    }

    let state = { assets: [], assetIds: [] } as t.ExtractFnOptions['state']
    let assets = [] as Asset[]

    if (prepareState) {
      const updatedState = prepareState(state)
      if (updatedState) state = { ...state, ...updatedState }
    }

    const control = {
      BREAK,
      REMOVE,
      SKIP,
    }

    const createAsset: t.ExtractFnOptions['createAsset'] = (
      propsOrType,
      props,
    ) => {
      const asset = propsOrType instanceof Asset ? propsOrType : new Asset()

      if (u.isStr(propsOrType)) {
        asset.type = propsOrType
      } else if (propsOrType instanceof Asset) {
        //
      } else if (u.isObj(propsOrType)) {
        if (propsOrType.id) asset.setId(propsOrType.id)
        if (propsOrType.type) asset.type = propsOrType.type
        if (u.isObj(propsOrType.props)) asset.merge(propsOrType.props)
      }

      if (u.isObj(props)) {
        asset.merge(props)
      }

      const assetId = asset.getId()

      if (assetId && !state.assetIds.includes(assetId)) {
        state.assetIds.push(assetId)
      }

      if (!assets.includes(asset)) assets.push(asset)
      return asset
    }

    const extractFnOptions: t.ExtractFnOptions = {
      assets,
      config,
      cadlEndpoint,
      control,
      createAsset,
      state,
    }

    if (config) {
      const baseUrl = config.baseUrl || ''
      const assetsUrl = replacePlaceholders(cadlEndpoint?.assetsUrl || '', {
        cadlBaseUrl: baseUrl,
      })
      extractFnOptions.baseUrl = baseUrl
      extractFnOptions.assetsUrl = assetsUrl
    }

    await visitAsync(value, async (key, node, path) => {
      for (const fnOrObject of u.array(use)) {
        let fn: t.ExtractFn | undefined
        let obj: { once?: boolean } | undefined

        if (u.isFnc(fnOrObject)) {
          fn = fnOrObject
        } else if (u.isObj(fnOrObject)) {
          const { extract, ...opts } = fnOrObject
          fn = extract
          obj = { ...opts }
        }

        let result = fn?.(key, node, path, extractFnOptions) as unknown

        if (u.isPromise(result)) result = (await result) as any

        if (obj?.once) {
          use.splice(use.indexOf(fnOrObject), 1)
        }

        if (result === BREAK) {
          return BREAK
        } else if (result === REMOVE) {
          return REMOVE
        } else if (result === SKIP) {
          return SKIP
        } else if (isNode(result)) {
          return result
        } else if (isPair(result)) {
          return result
        }
      }
    })

    if (as === 'object') {
      const mapping = {} as Record<string, Asset>

      for (const asset of assets) {
        mapping[asset.getId()] = asset
      }

      return mapping as t.ExtractReturnValue<As>
    }

    return assets as t.ExtractReturnValue<As>
  }

  Object.defineProperty(extract, c.idKey, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: c._id.extractor,
  })

  return {
    extract,
  }
}

export default createExtractor
export { createExtractor }

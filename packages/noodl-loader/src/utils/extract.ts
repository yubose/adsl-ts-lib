import type { LiteralUnion } from 'type-fest'
import type { AppConfig, Env, PageObject, RootConfig } from 'noodl-types'
import { createNoodlPlaceholderReplacer, isValidAsset } from 'noodl-utils'
import { is } from 'noodl-core'
import { getLinkStructure } from 'noodl-file'
import regex from '../internal/regex'
import { fetchYml, withYmlExt } from './yml'
import { typeOf } from './is'
import { defaultConfigHostname } from '../constants'
import Visitor from '../Visitor'
import y from 'yaml'

export function extractAssetsUrl(
  configObjectOrYml: AppConfig | RootConfig | string,
  env?: Env,
): string

export function extractAssetsUrl(options: {
  baseUrl?: string
  cadlVersion?: LiteralUnion<'latest', string>
  rootConfig?: RootConfig
}): string

export function extractAssetsUrl(
  configObjectOrYml:
    | AppConfig
    | RootConfig
    | string
    | {
        baseUrl?: string
        cadlVersion?: LiteralUnion<'latest', string>
        rootConfig?: RootConfig
      },
  env: Env = 'stable',
) {
  let config: RootConfig | undefined

  if (is.obj(configObjectOrYml)) {
    if ('rootConfig' in configObjectOrYml) {
      return extractAssetsUrl(configObjectOrYml.rootConfig, env)
    }
    if ('apiHost' in configObjectOrYml || 'startPage' in configObjectOrYml) {
      config = configObjectOrYml as RootConfig
    } else {
      throw new Error(
        `Tried to extract assetsUrl from an invalid argument. Expected a config object in options.rootConfig or as options but received ${typeOf(
          configObjectOrYml,
        )}`,
      )
    }
  } else if (is.str(configObjectOrYml)) {
    config = y.parse(configObjectOrYml)
  }
  if (is.obj(config)) {
    const { cadlBaseUrl = '', web } = config
    if (cadlBaseUrl) {
      return createNoodlPlaceholderReplacer({
        cadlBaseUrl: config.cadlBaseUrl,
        cadlVersion: web?.cadlVersion?.[env],
        designSuffix: '',
      })(`${cadlBaseUrl}assets/`)
    }
  }
  return ''
}

/**
 * Extracts asset urls from an object or an array of objects
 * @param { Record<string, any> | Record<string, any>[] } value
 * @returns { any[] }
 */
export async function extractAssets({
  additionalObjects,
  assetsUrl = '',
  dataType,
  configKey,
  rootConfig,
  appConfig,
  preload,
  pages,
}: {
  assetsUrl?: string
  configKey?: string
  dataType?: 'map' | 'object'
  rootConfig?: RootConfig
  appConfig?: AppConfig
  preload?: Record<string, any>
  pages?: Record<string, PageObject & Record<string, any>>
  additionalObjects?: Record<string, any>
}) {
  const assets = [] as ReturnType<typeof getLinkStructure>[]
  const visitedAssets = [] as string[]
  const urlCache = [] as string[]

  if (!assetsUrl && rootConfig) assetsUrl = extractAssetsUrl(assetsUrl)
  if (!assetsUrl) return assets
  if (!dataType) {
    dataType = [
      rootConfig,
      appConfig,
      ...Object.values({ ...additionalObjects, ...preload, ...pages }),
    ].some((value) => y.isDocument(value))
      ? 'map'
      : 'object'
  }

  if (regex.localAddress.test(assetsUrl) || !assetsUrl.startsWith('http')) {
    // Converts to the remote url
    assetsUrl = extractAssetsUrl(
      await fetchYml(
        `https://${defaultConfigHostname}/config/${withYmlExt(
          configKey || '',
        )}`,
        'json',
      ),
    )
  }

  const addAsset = (assetPath: string) => {
    if (!visitedAssets.includes(assetPath) && isValidAsset(assetPath)) {
      assets.push(
        getLinkStructure(assetPath, {
          prefix: assetsUrl,
          config: configKey,
        }),
      )
    }
  }

  if (dataType === 'map') {
    const nodes = [...Object.values({ ...preload, ...pages })]
    for (let visitee of nodes) {
      if (y.isDocument(visitee) || y.isNode(visitee)) {
        y.visit(visitee, {
          Scalar: (_, node) => {
            if (is.str(node.value)) {
              const value = node.value
              if (regex.video.test(value) && !urlCache.includes(value)) {
                urlCache.push(value)
                addAsset(value)
              }
            }
          },
        })
      }
    }
  } else {
    Visitor.createVisitor((key, value) => {
      if (
        is.str(value) &&
        regex.video.test(value) &&
        !urlCache.includes(value)
      ) {
        urlCache.push(value)
        addAsset(value)
      }
    })({
      ...additionalObjects,
      ...rootConfig,
      ...appConfig,
      ...preload,
      ...pages,
    })
  }

  return assets
}

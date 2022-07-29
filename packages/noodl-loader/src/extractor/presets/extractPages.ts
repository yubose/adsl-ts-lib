import type { ExtractFn } from '../extractorTypes'

const extractPages: ExtractFn = (
  key,
  node,
  path,
  { config, cadlEndpoint, createAsset, state },
) => {
  const preload = [] as string[]
  const pages = [] as string[]
  const ymls = [] as string[]

  if (config) {
    if (config.configKey) {
      ymls.push(`https://public.aitmed.com/config/${config.configKey}.yml`)
    }

    if (config.appKey) {
      let appKey = config.appKey

      if (!appKey.endsWith('.yml')) {
        appKey = `${appKey}.yml`
      }

      if (!ymls.includes(appKey)) {
        ymls.push(appKey)
      }
    }
  }

  if (cadlEndpoint) {
    if (cadlEndpoint.preload) preload.push(...cadlEndpoint.preload)
    if (cadlEndpoint.pages) pages.push(...cadlEndpoint.pages)
  }

  for (const yml of ymls) {
    const url = yml.startsWith('http')
      ? yml
      : `${cadlEndpoint?.assetsUrl}${yml}`
    const assetId = url

    if (!state.assetIds.includes(assetId)) {
      const assetType = url.includes('public.aitmed.com/config')
        ? 'config'
        : url.includes('cadlEndpoint')
        ? 'cadlEndpoint'
        : 'pages'

      createAsset({
        type: assetType,
        id: assetId,
        props: { value: yml, url },
      })

      state.assetIds.push(assetId)
    }
  }
}

export default extractPages

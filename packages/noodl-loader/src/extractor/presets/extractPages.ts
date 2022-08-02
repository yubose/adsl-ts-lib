import type { ExtractFn } from '../extractorTypes'
import { ExtractType } from '../../constants'

const extractPages: ExtractFn = (
  key,
  node,
  path,
  { config, cadlEndpoint, createAsset },
) => {
  const preload = [] as string[]
  const pages = [] as string[]
  // const ymls = [] as string[]

  if (config) {
    if (config.configKey) {
      // ymls.push(`https://public.aitmed.com/config/${config.configKey}.yml`)
    }

    if (config.appKey) {
      let appKey = config.appKey

      if (!appKey.endsWith('.yml')) {
        appKey = `${appKey}.yml`
      }

      // if (!ymls.includes(appKey)) {
      //   ymls.push(appKey)
      // }
    }
  }

  if (cadlEndpoint) {
    if (cadlEndpoint.preload) preload.push(...cadlEndpoint.preload)
    if (cadlEndpoint.pages) pages.push(...cadlEndpoint.pages)
  }

  for (const page of pages) {
    const name = page.endsWith('.yml')
      ? page.substring(0, page.length - 4)
      : page
    const filename = `${name}.yml`
    const url = `${config?.baseUrl}${filename}`
    createAsset({
      type: ExtractType.Page,
      id: filename,
      props: {
        url,
        name,
        filename,
        ext: 'yml',
      },
    })
  }

  // for (const yml of ymls) {
  //   const url = replacePlaceholders(
  //     yml.startsWith('http') ? yml : `${config?.baseUrl}${yml}`,
  //     {},
  //   )
  //   const assetId = url

  //   const assetType = url.includes('public.aitmed.com/config')
  //     ? ExtractType.Config
  //     : url.includes('cadlEndpoint')
  //     ? ExtractType.CadlEndpoint
  //     : ExtractType.Page

  //   createAsset({
  //     type: assetType,
  //     id: assetId,
  //     props: { value: yml, url },
  //   })
  // }
}

export default extractPages

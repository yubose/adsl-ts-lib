import * as u from '@jsmanifest/utils'
import { ConsumerOptions, NUI, Transformer } from 'noodl-ui'
import type {
  AppConfig,
  ComponentObject,
  PageObject,
  RootConfig,
} from 'noodl-types'
import type { Logger } from 'winston'
import monkeyPatchEventListener, { OnPatch } from './monkeyPatchEventListener'
import type { ErrorLikeObject } from './types'

export interface Use {
  config?: RootConfig
  appConfig?: AppConfig
  log?: Logger
  preload?: Record<string, any>
  pages?: Record<string, any>
  viewport?: { width: number; height: number }
}

u.newline()

const nui = NUI

/**
 * @typedef { import('noodl-ui').NuiComponent.Instance } NuiComponent
 * @typedef { import('noodl-ui').Page } NuiPage
 * @typedef { import('@babel/traverse').NodePath } NodePath
 */

/**
 * @param { object } opts
 * @param { string } [opts.configUrl]
 * @param { string } [opts.configKey]
 * @param { string } [opts.ecosEnv]
 * @param { Use } [opts.use]
 * @returns { Promise<{ cache: import('@aitmed/cadl')['cache']; components: nt.ComponentObject[]; nui: typeof NUI; page: NuiPage; sdk: CADL; pages: Record<string, nt.PageObject>; transform: (componentProp: nt.ComponentObject, options: import('noodl-ui').ConsumerOptions) => Promise<NuiComponent.Instance> }> }
 */
export async function getGenerator({
  configKey = 'www',
  configUrl = `https://public.aitmed.com/config/${configKey}.yml`,
  ecosEnv = 'stable',
  use = {} as Use,
} = {}) {
  try {
    // Patches the EventTarget so we can sandbox the sdk
    monkeyPatchEventListener({
      /**
       * Proxy the addEventListener and removeEventListener to the JSDOM events so lvl3 doesn't give the IllegalInvocation error from mismatching instance shapes
       */
      onPatch: u.reduce(
        ['addEventListener', 'removeEventListener'],
        (acc, evtName) => {
          /**
           * @argument { object } args
           * @param { boolean } args.wasPatched
           */
          acc[evtName] = function onPatch({
            wasPatched,
          }: { wasPatched?: boolean } = {}) {
            let label = ''
            label += u.yellow('EventTarget')
            label += u.magenta('#')
            label += u.white(evtName)
            if (wasPatched) {
              console.info(`${u.cyan(`${label} is already patched.`)}`)
            } else {
              console.info(`${u.cyan(`${label}`)} ${u.green('patched!')}`)
            }
          }
          return acc
        },
        {} as OnPatch,
      ),
    })

    // const { default: JsDOM } = await import('jsdom-global')

    require('jsdom-global')('', {
      resources: 'usable',
      runScripts: 'dangerously',
      url: `https://127.0.0.1:3001`,
      beforeParse: (win) => {
        global.EventTarget = win.EventTarget
        global.localStorage = win.localStorage
        // eslint-disable-next-line
        localStorage = win.localStorage
        // Silences the "getContext" is not implemented message during build
        win.HTMLCanvasElement.prototype.getContext = () => ({} as any)
      },
    })

    // Intentionally using require
    const { cache, CADL } = await import('@aitmed/cadl')

    const sdk = new CADL({
      // aspectRatio: 0.59375,
      // @ts-expect-error
      cadlVersion: ecosEnv,
      configUrl,
    })

    await sdk.init({
      use: {
        ...use.preload,
        config: use.config,
        cadlEndpoint: use.appConfig,
      },
    })

    nui.use({
      getRoot: () => sdk.root,
      getAssetsUrl: () => sdk.assetsUrl,
      getBaseUrl: () => sdk.cadlBaseUrl,
      getPreloadPages: () => sdk.cadlEndpoint?.preload || [],
      getPages: () => sdk.cadlEndpoint?.page || [],
    })

    const pages = {} as Record<string, PageObject | ErrorLikeObject>

    // App pages
    await Promise.all(
      sdk.cadlEndpoint.page.map(async (pageName: string) => {
        try {
          if (sdk.cadlEndpoint.preload.includes(pageName)) {
            if (/^(Base[a-zA-Z0-9]+)/.test(pageName)) return
          }

          const pageArg = use.pages?.json?.[pageName]
            ? { pageName, cadlObject: use.pages?.json?.[pageName] }
            : pageName

          // @ts-expect-error
          await sdk.initPage(pageArg, [], {
            wrapEvalObjects: false,
          })

          if (use.pages) use.pages.json[pageName] = sdk.root[pageName]
          pages[pageName] = sdk.root[pageName]
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          pages[pageName] = {
            name: err.name,
            message: err.message,
            stack: err.stack,
          }
          console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
        }
      }),
    )

    // Fixes navbar to stay at the top
    if (u.isObj(sdk.root?.BaseHeader?.style)) {
      sdk.root.BaseHeader.style.top = '0'
    }

    const transformer = new Transformer()
    const page = nui.createPage({
      id: 'root',
      name: sdk.cadlEndpoint.startPage || '',
      viewport: use?.viewport || { width: 0, height: 0 },
    })

    async function transform(
      componentProp: ComponentObject,
      options?: ConsumerOptions,
    ) {
      if (!componentProp) componentProp = {} as ComponentObject
      const component = nui.createComponent(componentProp, page)
      const consumerOptions = nui.getConsumerOptions({
        component,
        page,
        viewport: use.viewport || page.viewport,
        ...options,
      })

      await transformer.transform(component, consumerOptions)

      return component
    }

    return { cache, nui: NUI, page, pages, sdk, transform }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

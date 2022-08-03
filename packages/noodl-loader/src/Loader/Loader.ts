import * as u from '@jsmanifest/utils'
import y from 'yaml'
import { createExtractor } from '../extractor'
import NoodlConfig from '../Config'
import NoodlCadlEndpoint from '../CadlEndpoint'
import { isNode, merge, toDocument, unwrap } from '../utils/yml'
import { assertNonEmpty } from '../utils/assert'
import { isPageInArray } from './loaderUtils'
import type { YAMLNode } from '../types'
import type Strategy from './Strategy'
import * as is from '../utils/is'
import * as t from './loaderTypes'

class NoodlLoader extends t.AbstractLoader {
  #extractor: ReturnType<typeof createExtractor>
  #root: {
    Config: NoodlConfig | null
    Global: Record<string, YAMLNode>
  } & { [key: string]: any }

  config: NoodlConfig
  cadlEndpoint: NoodlCadlEndpoint;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      config: this.config.toJSON(),
      cadlEndpoint: this.cadlEndpoint.toJSON(),
      rootKeys: u.keys(this.#root),
      strategies: this.strategies,
    }
  }

  constructor() {
    super()
    this.#root = {
      Config: new NoodlConfig(),
      Global: {} as Record<string, YAMLNode>,
    }
    this.config = this.#root.Config as NoodlConfig
    this.cadlEndpoint = new NoodlCadlEndpoint()
    this.#extractor = createExtractor()
  }

  get root() {
    return this.#root
  }

  extract(
    node: Parameters<ReturnType<typeof createExtractor>['extract']>[0],
    options: Omit<
      Parameters<ReturnType<typeof createExtractor>['extract']>[1],
      'config' | 'cadlEndpoint'
    >,
  ) {
    return this.#extractor.extract(node, {
      ...options,
      config: this.config,
      cadlEndpoint: this.cadlEndpoint,
    })
  }

  getOptions<O extends Record<string, any> = Record<string, any>>(other?: O) {
    return {
      config: this.config,
      cadlEndpoint: this.cadlEndpoint,
      root: this.root,
      ...other,
    }
  }

  /**
   *
   * @param value Config, cadlEndpoint, preload name, page name, URL, filepath
   * @param param1
   */
  async load(
    value: string,
    {
      preload = true,
      pages = true,
      strategies = [],
    }: {
      preload?: boolean
      pages?: boolean
      strategies?: Strategy | Strategy[]
    } = {},
  ) {
    try {
      let doc: y.Document<y.Node<any>> | undefined

      strategies = [...u.array(strategies), ...this.strategies].reduce(
        (acc, strategy) => {
          if (!acc.includes(strategy)) return acc.concat(strategy)
          return acc
        },
        [] as Strategy[],
      )

      for (const strategy of strategies) {
        if (strategy.is(value, this.getOptions())) {
          let { name } = strategy.parse(value, this.getOptions())
          let { configKey, appKey } = this.config
          let formattedValue = strategy.format(value, this.getOptions())

          if (name) {
            let doc: y.Document<y.Node<any>> | undefined
            let yml = strategy.load(formattedValue, this.getOptions())

            if (u.isPromise(yml)) yml = await yml

            doc = toDocument(yml)

            if (configKey.includes(name)) {
              this.loadRootConfig(doc)
            } else if (appKey.includes(name)) {
              this.loadAppConfig(doc)
            } else {
              if (isPageInArray(this.cadlEndpoint.preload, name) && preload) {
                if (preload) {
                  for (const item of this.cadlEndpoint.preload) {
                    const yml = strategy.load(item, this.getOptions())
                    const doc = toDocument(yml)
                    this.loadPreload(name, doc)
                  }
                }
              } else if (
                isPageInArray(this.cadlEndpoint.pages, name) &&
                pages
              ) {
                for (const item of this.cadlEndpoint.preload) {
                  const yml = strategy.load(item, this.getOptions())
                  const doc = toDocument(yml)
                  this.loadPage(name, doc)
                }
              }
            }
          }

          if (y.isMap(doc?.contents)) {
            // const isRootConfig = doc === config
            const isRootConfig = false
            // const name = (
            //   isRootConfig ? this.config.configKey : this.config.appKey
            // ).replace(/_en|\.yml/i, '')

            doc?.contents.items.forEach((pair) => {
              const key = unwrap(pair.key) as string
              const value = y.isNode(pair.value)
                ? pair.value.toJSON()
                : pair.value

              if (isRootConfig) {
                if (key === 'cadlBaseUrl') {
                  this.config.baseUrl = value
                } else if (key === 'cadlMain') {
                  this.config.appKey = value
                } else {
                  this.config[key] = value
                }
              } else {
                if (key === 'page') {
                  this.cadlEndpoint.pages = value
                } else {
                  this.cadlEndpoint[key] = value
                }
              }
            })
          }
        }
      }

      // if (url.pathname.endsWith('.yml')) {
      //   let { configKey, appKey } = this.config
      //   let doc = await fetchYml(url.href, 'doc')
      //   if (doc) {
      //     if (configKey && name === configKey) {
      //       this.loadRootConfig(doc)
      //       if (options?.appConfig === false) return
      //       // TODO - Continue with app config
      //     } else if ((appKey && name === appKey) || appKey.includes(name)) {
      //       this.loadAppConfig(doc)
      //     } else {
      //       if (is.stringInArray(this.cadlEndpoint.preload, name)) {
      //         this.loadPreload(doc)
      //       } else if (is.stringInArray(this.cadlEndpoint.pages, name)) {
      //         this.loadPage(name, doc)
      //       }
      //     }
      //   }
      // }

      // if (isPageInArray(this.cadlEndpoint.preload, name)) {
      //   this.loadPreload(doc)
      // } else if (isPageInArray(this.cadlEndpoint.pages, name)) {
      //   this.loadPage(name, doc)
      // } else {
      //   //
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      throw err
    }
  }

  loadRootConfig(
    rootConfig: y.Document.Parsed<y.ParsedNode> | y.Document<y.Node>,
  ) {
    assertNonEmpty(rootConfig, 'rootConfig')

    if (y.isMap(rootConfig.contents)) {
      for (const pair of rootConfig.contents.items) {
        const key = String(pair.key)
        if (u.isStr(key)) {
          if (
            [
              'apiHost',
              'apiPort',
              'webApiHost',
              'appApiHost',
              'connectiontimeout',
              'loadingLevel',
              'debug',
              'cadlBaseUrl',
              'cadlMain',
              'timestamp',
              'viewWidthHeightRatio',
            ].includes(key)
          ) {
            const nodeValue = unwrap(pair.value)

            if (y.isMap(nodeValue)) {
              this.config[key] = nodeValue.items.reduce((acc, pair) => {
                acc[unwrap(pair.key) as string] = unwrap(pair.value)
                return acc
              }, {})
            } else {
              if (key === 'cadlBaseUrl') {
                this.config.baseUrl = nodeValue as string
              } else if (key === 'cadlMain') {
                this.config.appKey = nodeValue as string
                this.config[key] = nodeValue as string
              } else {
                this.config[key] = nodeValue
              }
            }
          } else if (['web', 'ios', 'android'].includes(key)) {
            this.config[key] = pair.value
          }
        }
      }
    }

    return this
  }

  loadAppConfig(
    appConfig: y.Document.Parsed<y.ParsedNode> | y.Document<y.Node>,
  ) {
    assertNonEmpty(appConfig, 'appConfig')

    if (y.isMap(appConfig.contents)) {
      for (const pair of appConfig.contents.items) {
        const key = String(pair.key)
        const nodeValue = unwrap(pair.value) as any

        if (/assetsUrl|baseUrl|fileSuffix/i.test(key)) {
          this.cadlEndpoint[key] = nodeValue
        } else if (key === 'languageSuffix') {
          this.cadlEndpoint[key] = nodeValue
        } else if (key === 'startPage') {
          this.cadlEndpoint[key] = nodeValue
        } else if (key === 'preload') {
          this.cadlEndpoint[key] = y.isSeq(nodeValue)
            ? nodeValue.items.map(unwrap)
            : nodeValue
        } else if (key === 'page') {
          this.cadlEndpoint.pages = y.isSeq(nodeValue)
            ? nodeValue.items.map(unwrap)
            : nodeValue
        }
      }
    }

    return this
  }

  loadPreload(name: YAMLNode | string, preload?: YAMLNode) {
    if (u.isStr(name)) {
      this.#root[name] = preload
    } else if (isNode(name)) {
      merge(this.#root, name)
    }
    return this
  }

  loadPage(name: string, page: any) {
    if (u.isStr(name)) {
      this.#root[name] = page
    } else if (isNode(name)) {
      this.#root[name] = page
    }
    return this
  }

  use(value: Strategy) {
    if (is.strategy(value)) {
      this.strategies?.push(value)
    }
    return this
  }
}

export default NoodlLoader

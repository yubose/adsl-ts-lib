import * as u from '@jsmanifest/utils'
import y from 'yaml'
import fs from 'fs-extra'
import path from 'path'
import { createExtractor } from '../extractor'
import NoodlConfig from '../config'
import NoodlCadlEndpoint from '../cadlendpoint'
import {
  isNode,
  merge,
  fetchYml,
  getNodeTypeLabel,
  toDocument,
  unwrap,
} from '../utils/yml'
import { assertNonEmpty } from '../utils/assert'
import { trimPageName } from '../utils/trim'
import type { YAMLNode } from '../types'
import type Strategy from './strategy'
import * as is from '../utils/is'
import * as t from './loader-types'

function spreadToRoot(root: NoodlLoader['root'], node: y.Document | y.YAMLMap) {
  if (y.isDocument(node)) {
    node = node.contents as y.YAMLMap
  }
  if (y.isMap(node)) {
    node.items.forEach((pair) => {
      root[String(pair.key)] = pair.value
    })
  }
  return root
}

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
    options: {
      fs?: any
      mode?: 'url' | 'file'
      overwrite?: boolean
      preload?: boolean
      pages?: boolean
      strategies?: Strategy | Strategy[]
    } = {},
  ) {
    const {
      mode = 'url',
      overwrite = false,
      preload = true,
      pages = true,
      strategies = [],
    } = options || {}

    const fsys = (options?.fs || fs) as typeof fs

    try {
      if (!value) return

      let doc: y.Document<y.Node<any>> | undefined

      if (u.isStr(value)) {
        // If just config key, load by remote url
        if (
          value === this.config.configKey ||
          value === this.config.configKey + '.yml'
        ) {
          //
        }

        // If url, fetch yml remotely

        if (is.url(value)) {
          const name = path.parse(value).name || ''
          if (name) {
            doc = await fetchYml(value, 'doc')
            if (this.cadlEndpoint.pageExists(name)) {
              this.root[name] = doc
            } else if (this.cadlEndpoint.preloadExists(name)) {
              if (y.isMap(doc.contents)) {
                spreadToRoot(this.root, doc.contents)
              } else {
                throw new Error(
                  `Expected a YAMLMap for preload but received ${getNodeTypeLabel(
                    doc.contents,
                  )}`,
                )
              }
            } else {
              throw new Error(
                `The page name or preload item "${name}" does not exist in cadlEndpoint (Original value: ${value})`,
              )
            }
          } else {
            throw new Error(`${value} returned an empty value`)
          }
        }

        // If yml is config, load the rest of the app by config -> cadlEndpoint -> preload -> page

        // If yml is cadlEndpoint, load the rest of the app by cadlEndpoint -> preload -> page

        // If yml is preload, load / spread keys

        // If yml is page, load

        // If directory, use loader.config.configKey to search for a directory that has it, and load the app using config -> cadlEndpoint -> preload -> page
        else {
          if (is.file(value) || value.includes('/')) {
            try {
              if (!path.isAbsolute(value)) value = path.resolve(value)
              const { name } = path.parse(value)
              if (name in this.root && !overwrite) return
              const yml = await fsys.readFile(value, 'utf8')
              const doc = toDocument(yml)
              if (this.cadlEndpoint.preloadExists(name)) {
                console.log('HELLO?')
                console.log('HELLO?')
                console.log('HELLO?')

                spreadToRoot(this.root, doc)
              } else {
                this.root[name] = doc
              }
            } catch (error) {
              const err =
                error instanceof Error ? error : new Error(String(error))
              if ('code' in err && err['code']) {
                // File not found
                throw err
              }
              console.error(err)
            }
          } else {
            if (this.cadlEndpoint.preloadExists(value)) {
              const url = this.cadlEndpoint.getURL(value)
              const doc = await fetchYml(url, 'doc')
              if (y.isMap(doc.contents)) {
                spreadToRoot(this.root, doc.contents)
              } else {
                throw new Error(
                  `Expected a YAMLMap for preload but received ${getNodeTypeLabel(
                    doc.contents,
                  )}`,
                )
              }
            } else if (this.cadlEndpoint.pageExists(value)) {
              const url = this.cadlEndpoint.getURL(value)
              const name = trimPageName(value)
              this.root[name] = await fetchYml(url, 'doc')
            } else {
              throw new Error(
                `"${value}" could not be identified as a config, cadlEndpoint, preload, or page`,
              )
            }
          }
        }
      }

      // if (name) {
      //   let doc: y.Document<y.Node<any>> | undefined
      //   let yml = strategy.load(formattedValue, this.getOptions())

      //   if (u.isPromise(yml)) yml = await yml

      //   doc = toDocument(yml)

      //   if (configKey.includes(name)) {
      //     this.loadRootConfig(doc)
      //   } else if (appKey.includes(name)) {
      //     this.loadAppConfig(doc)
      //   } else {
      //     if (isPageInArray(this.cadlEndpoint.preload, name) && preload) {
      //       if (preload) {
      //         for (const item of this.cadlEndpoint.preload) {
      //           const yml = strategy.load(item, this.getOptions())
      //           const doc = toDocument(yml)
      //           this.loadPreload(name, doc)
      //         }
      //       }
      //     } else if (isPageInArray(this.cadlEndpoint.pages, name) && pages) {
      //       for (const item of this.cadlEndpoint.preload) {
      //         const yml = strategy.load(item, this.getOptions())
      //         const doc = toDocument(yml)
      //         this.loadPage(name, doc)
      //       }
      //     }
      //   }
      // }

      if (y.isMap(doc?.contents)) {
        // const isRootConfig = doc === config
        const isRootConfig = false
        // const name = (
        //   isRootConfig ? this.config.configKey : this.config.appKey
        // ).replace(/_en|\.yml/i, '')

        doc?.contents.items.forEach((pair) => {
          const key = unwrap(pair.key) as string
          const value = y.isNode(pair.value) ? pair.value.toJSON() : pair.value

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

import * as u from '@jsmanifest/utils'
import inv from 'invariant'
import y from 'yaml'
import fs from 'fs-extra'
import path from 'path'
import set from 'lodash/set'
import { fp, is as coreIs } from 'noodl-core'
import { createExtractor } from '../extractor'
import loadFile from '../utils/load-file'
import NoodlConfig from '../config'
import NoodlCadlEndpoint from '../cadlendpoint'
import typeOf from '../utils/type-of'
import {
  fetchYml,
  getNodeTypeLabel,
  isDocument,
  parse as parseYml,
  parseAs,
  stringify,
  toDocument,
} from '../utils/yml'
import * as create from '../utils/create'
import {
  quoteIfEmptyStr,
  ensureSuffix,
  joinPaths,
  endpoint as toEndpoint,
  toPathname,
} from '../utils/format'
import { replacePlaceholders } from '../utils/replace'
import { trimPageName } from '../utils/trim'
import FileSystemHost from '../file-system'
import type { As, YAMLNode } from '../types'
import * as is from '../utils/is'
import * as c from '../constants'
import * as t from './loader-types'

export interface LoadConfigOptions {
  dir?: string
  fs?: FileSystemHost
  mode?: 'file' | 'url'
  onCadlEndpointError?: (error: Error) => void
  root?: Record<string, any>
}

export async function getYml(
  this: NoodlLoader,
  options: {
    baseUrl?: string
    dir?: string
    mode?: t.LoadType
    value: unknown
  },
): Promise<any> {
  try {
    let { baseUrl = '', dir = '', mode, value } = options
    let yml = ''

    if (coreIs.obj(value)) {
      yml = stringify(value)
    } else if (coreIs.str(value)) {
      yml = value
    }

    // Intentionally caching the value
    let _value = yml

    if (!mode) {
      const isConfigKey = is.configKey(this.configKey, _value)
      const isPreload = this.cadlEndpoint.preloadExists(_value)
      const isPage = this.cadlEndpoint.pageExists(_value)
      const isUrl = is.url(_value)

      mode = isUrl || isConfigKey || isPreload || isPage ? 'url' : 'file'

      if (isConfigKey || isPreload || isPage) {
        const baseUrl = isConfigKey ? c.baseRemoteConfigUrl : options?.baseUrl
        const pathname = `/${ensureSuffix('.yml', _value)}`
        _value = toEndpoint(baseUrl as string, pathname)
        console.log({ _value, baseUrl })
      }
    }
    switch (mode) {
      case 'file': {
        inv(!!options.dir, `Cannot load "${value}". Directory not provided`)
        inv(is.file, `Cannot retrieve from invalid filepath "${_value}"`)
        return (await this.fs.readFile(
          path.resolve(path.join(dir, _value)),
          'utf8',
        )) as string
      }
      case 'url': {
        inv(is.url(_value), `Cannot retrieve from invalid URL "${_value}"`)
        let url = `${baseUrl}`
        if (baseUrl.endsWith('/') && _value.startsWith('/')) {
          url = url.substring(0, url.length - 1)
        }
        url += _value
        return fetchYml(_value)
      }
      default:
        return _value
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

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
  #fs: FileSystemHost
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
    }
  }

  constructor() {
    super()
    this.#fs = fs as FileSystemHost
    this.#root = {
      Config: new NoodlConfig(),
      Global: {} as Record<string, YAMLNode>,
    }
    this.config = this.#root.Config as NoodlConfig
    this.config.rootConfigUrl = c.baseRemoteConfigUrl
    this.cadlEndpoint = new NoodlCadlEndpoint()
    this.#extractor = createExtractor()
  }

  get appKey() {
    return (this.config.appKey || this.config.get('cadlMain') || '') as string
  }

  get configKey() {
    return this.config.configKey
  }

  get fs() {
    return this.#fs
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
   * @param value Config, cadlEndpoint, preload name, page name, URL, filepath
   * @param options
   */
  async load(
    value: string,
    options: {
      dir?: string
      mode?: 'url' | 'file'
      overwrite?: boolean
      onCadlEndpointError?: (error: Error) => void
      includePreload?: boolean
      includePages?: boolean
    } = {},
  ) {
    const handlePreloadOrPage = async (name: string, yml: string) => {
      try {
        const isPreload = this.cadlEndpoint.preloadExists(name)
        const isPage = this.cadlEndpoint.pageExists(name)
        const doc = parseAs('doc', yml)
        if (isPreload) {
          spreadToRoot(this.root, doc.contents as any)
        } else if (isPage) {
          this.root[name] = doc
        } else {
          throw new Error(
            `"${value}" (name: ${quoteIfEmptyStr(
              name,
            )}) is not an item of preload or page list`,
          )
        }
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error))
      }
    }

    if (is.configKey(this.configKey, value)) {
      const yml = await getYml.call(this, {
        baseUrl: c.baseRemoteConfigUrl,
        dir: options?.dir,
        mode: options?.mode,
        value: create.configUri(value),
      })

      await this.loadConfig(yml, options)
      await this.load(this.appKey, options)

      if (options?.includePreload) {
        await Promise.all(
          this.cadlEndpoint
            .getPreload()
            .map((preload) => this.load(preload, options)),
        )
      }

      if (options?.includePages) {
        await Promise.all(
          this.cadlEndpoint.getPages().map((page) => this.load(page, options)),
        )
      }
    } else if (is.appKey(this.appKey, value)) {
      await this.loadCadlEndpoint(
        await getYml.call(this, {
          baseUrl: this.config.resolve(
            this.config.get('cadlBaseUrl'),
          ) as string,
          dir: options?.dir,
          mode: options?.mode,
          value,
        }),
        options,
      )

      if (options?.includePreload) {
        await Promise.all(
          this.cadlEndpoint
            .getPreload()
            .map((preload) => this.load(preload, options)),
        )
      }

      if (options?.includePages) {
        await Promise.all(
          this.cadlEndpoint.getPages().map((page) => this.load(page, options)),
        )
      }
    } else if (
      this.cadlEndpoint.preloadExists(value) ||
      this.cadlEndpoint.pageExists(value)
    ) {
      await handlePreloadOrPage(
        value,
        await getYml.call(this, {
          baseUrl: this.config.resolve(this.cadlEndpoint.baseUrl) as string,
          dir: options?.dir,
          mode: options?.mode,
          value,
        }),
      )
    } else if (is.url(value)) {
      //
    } else if (is.file(value)) {
      //
    }
  }

  async loadConfig(yml: string, { dir = '' }: { dir?: string } = {}) {
    try {
      inv(Boolean(yml), `yml cannot be empty`)

      if (is.configKey(this.configKey, yml)) {
        yml = await getYml.call(this, {
          baseUrl: this.config.rootConfigUrl,
          dir,
          value: yml,
        })
      }

      const configJson = parseYml('object', yml)

      inv(
        u.isObj(configJson),
        `Expected an object for config but received ${typeOf(configJson)}`,
      )

      u.entries(configJson).forEach(([k, v]) => this.config.set(k, v))

      // if (configJson.cadlMain) {
      //   let yml = ''

      //   if (options?.mode === 'file') {
      //     inv(
      //       !!options.dir,
      //       `Cannot load ${quoteIfEmptyStr(
      //         configJson.cadlMain,
      //       )} from the file system without a directory provided`,
      //     )
      //     const fsys = options.fs || fs
      //     const dirfiles = await fsys.readdir(options.dir || '', 'utf8')
      //     const cadlMainName = trimPageName(configJson.cadlMain)
      //     const filename = dirfiles.find((name) => name.includes(cadlMainName))
      //     const filepath = joinPaths(options.dir, filename)
      //     yml = await fsys.readFile(filepath, 'utf8')
      //   } else {
      //     const url = `${configJson.cadlBaseUrl || ''}${configJson.cadlMain}`

      //     inv(
      //       configJson.cadlBaseUrl,
      //       `Base URL is empty. Cannot load ${quoteIfEmptyStr(
      //         configJson.cadlMain,
      //       )} without a valid base url. Received: ${quoteIfEmptyStr(
      //         configJson.cadlBaseUrl,
      //       )}`,
      //     )
      //     inv(
      //       is.url(url),
      //       `Attempted to load ${quoteIfEmptyStr(
      //         configJson.cadlMain,
      //       )} but the URL constructed is not a valid URL. Received: ${quoteIfEmptyStr(
      //         url,
      //       )}`,
      //     )

      //     yml = await fetchYml(url)
      //   }

      //   await this.loadCadlEndpoint(yml, options)
      // } else {
      //   const err = new Error(
      //     `cadlEndpoint could not be fetched. cadlMain is empty or missing`,
      //   )
      //   console.error(err)
      //   options?.onCadlEndpointError?.(err)
      //   throw err
      // }
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  async loadCadlEndpoint(
    arg1?:
      | string
      | y.Document<y.Node<any>>
      | (Record<string, any> & { dir?: string })
      | null
      | undefined,
    arg2?: {
      dir?: string
      fs?: FileSystemHost
      includePreload?: boolean
      includePages?: boolean
      mode?: 'file' | 'url'
      root?: Record<string, any>
    },
  ) {
    let _yml = ''

    if (coreIs.obj(arg1)) {
      if (y.isNode(arg1) || y.isPair(arg1) || y.isDocument(arg1)) {
        //
      } else {
        let appKey = this.appKey || this.config.get('cadlMain')

        inv(
          !!appKey,
          `Config must be loaded containing the app key (cadlMain) if no arguments are provided`,
        )

        if (this.appKey !== appKey || this.config.get('cadlMain') !== appKey) {
          this.config.set('cadlMain', appKey)
        }

        appKey = ensureSuffix('.yml', appKey)

        const mode = arg1.dir ? 'file' : ('url' as t.LoadType)

        if (mode === 'file') {
          inv(
            !!arg1.dir,
            `Directory is required when loading cadlEndpoint and mode === 'file'`,
          )
          const filepath = path.join(arg1.dir, appKey)
          _yml = (await this.#fs.readFile(filepath, 'utf8')) as string
        } else {
          const baseUrl = this.config.resolve(this.cadlEndpoint.baseUrl)
          _yml = await fetchYml(baseUrl as string)
        }
      }
    } else if (coreIs.str(arg1)) {
      //
    } else {
      //
    }

    const options = ({} as typeof arg2) || {}
    const value = parseAs('json', _yml)

    try {
      if (coreIs.obj(arg2)) Object.assign(options, arg2)

      const replacePlaceholder = (str: string) =>
        replacePlaceholders(str, this?.config?.toJSON())

      if (u.isObj(value)) {
        for (let [key, val] of u.entries(value)) {
          if (key === 'preload') {
            this.cadlEndpoint.getPreload().push(...val)
          } else if (key === 'page' || key === 'pages') {
            this.cadlEndpoint.getPages().push(...val)
          } else {
            this.cadlEndpoint?.set?.(key, replacePlaceholder(val))
          }
        }
      }

      if (options?.includePreload) {
        for (let preload of this.cadlEndpoint?.getPreload() || []) {
          preload = ensureSuffix('.yml', preload)

          let isLoadFile = options.mode === 'file'
          let yml = ''
          let name = trimPageName(preload)

          if (isLoadFile) {
            inv(
              options.dir,
              `Cannot load preload items without a directory provided when mode === 'file'`,
            )

            const fsys = options.fs || fs
            yml = (await fsys.readFile(
              path.join(options.dir || '', preload),
              'utf8',
            )) as string
          } else {
            const url = `${this.cadlEndpoint?.baseUrl}${preload}`
            yml = await fetchYml(url)
          }

          const doc = parseYml('map', yml)

          if (y.isMap(doc.contents)) {
            spreadToRoot(
              (options?.root || {}) as NoodlLoader['root'],
              doc.contents,
            )
          } else {
            set(options, `root.${name}`, doc)
          }
        }
      }

      if (options?.includePages) {
        inv(
          !u.isUnd(options.root),
          `Root object must be provided when loading cadlEndpoint and includePages === true`,
        )

        for (let page of this.cadlEndpoint?.getPages() || []) {
          const name = page
          page = ensureSuffix('.yml', page)

          let isLoadFile = options.mode === 'file'
          let yml = ''

          if (isLoadFile) {
            inv(
              options.dir,
              `Cannot load pages without a directory provided when mode === 'file'`,
            )

            const fsys = options.fs || fs
            yml = (await fsys.readFile(
              path.join(options.dir || '', page),
              'utf8',
            )) as string
          } else {
            const url = `${this.cadlEndpoint?.baseUrl}${page}`
            yml = await fetchYml(url)
          }

          const doc = parseYml('map', yml)
          set(options, `root.${name}`, doc)
        }
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  use(value: FileSystemHost) {
    if (is.fileSystemHost(value)) {
      this.#fs = value
    }
    return this
  }
}

export default NoodlLoader

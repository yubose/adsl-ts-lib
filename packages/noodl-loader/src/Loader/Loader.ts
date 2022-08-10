import * as u from '@jsmanifest/utils'
import inv from 'invariant'
import y from 'yaml'
import fs from 'fs-extra'
import path from 'path'
import set from 'lodash/set'
import { createExtractor } from '../extractor'
import loadFile from '../utils/load-file'
import NoodlConfig from '../config'
import NoodlCadlEndpoint from '../cadlendpoint'
import typeOf from '../utils/type-of'
import {
  fetchYml,
  getNodeTypeLabel,
  parse as parseYml,
  toDocument,
} from '../utils/yml'
import * as create from '../utils/create'
import {
  quoteIfEmptyStr,
  ensureSuffix,
  joinPaths,
  toPathname,
} from '../utils/format'
import { replacePlaceholders } from '../utils/replace'
import { trimPageName } from '../utils/trim'
import type { YAMLNode } from '../types'
import * as is from '../utils/is'
import * as c from '../constants'
import * as t from './loader-types'

async function loadConfig(
  this: NoodlLoader,
  yml: string,
  options?: {
    config?: NoodlConfig
    cadlEndpoint?: NoodlCadlEndpoint
    dir?: string
    fs?: typeof fs
    mode?: 'file' | 'url'
    onCadlEndpointError?: (error: Error) => void
    root?: Record<string, any>
  },
) {
  try {
    inv(Boolean(yml), `yml cannot be empty`)

    const configObj = parseYml('object', yml)

    inv(
      u.isObj(configObj),
      `Expected an object for config but received ${typeOf(configObj)}`,
    )

    for (const [key, val] of u.entries(configObj)) {
      this.config?.set(key, val)
    }

    if (configObj.cadlMain) {
      let yml = ''

      if (options?.mode === 'file') {
        inv(
          !!options.dir,
          `Cannot load ${quoteIfEmptyStr(
            configObj.cadlMain,
          )} from the file system without a directory provided`,
        )
        const fsys = options.fs || fs
        const dirfiles = await fsys.readdir(options.dir, 'utf8')
        const cadlMainName = trimPageName(configObj.cadlMain)
        const filename = dirfiles.find((name) => name.includes(cadlMainName))
        const filepath = joinPaths(options.dir, filename)
        yml = await fsys.readFile(filepath, 'utf8')
      } else {
        const url = `${configObj.cadlBaseUrl || ''}${configObj.cadlMain}`

        inv(
          configObj.cadlBaseUrl,
          `Base URL is empty. Cannot load ${quoteIfEmptyStr(
            configObj.cadlMain,
          )} without a valid base url. Received: ${quoteIfEmptyStr(
            configObj.cadlBaseUrl,
          )}`,
        )
        inv(
          is.url(url),
          `Attempted to load ${quoteIfEmptyStr(
            configObj.cadlMain,
          )} but the URL constructed is not a valid URL. Received: ${quoteIfEmptyStr(
            url,
          )}`,
        )

        yml = await fetchYml(url)
      }

      await loadCadlEndpoint.call(this, yml, options)
    } else {
      const err = new Error(
        `cadlEndpoint could not be fetched. cadlMain is empty or missing`,
      )
      console.error(err)
      options?.onCadlEndpointError?.(err)
      throw err
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
}

async function loadCadlEndpoint(
  this: NoodlLoader,
  yml: string,
  options?: {
    dir?: string
    fs?: typeof fs & Record<string, any>
    includePreload?: boolean
    includePages?: boolean
    mode?: 'file' | 'url'
    root?: Record<string, any>
  },
) {
  try {
    const cadlEndpointObj = parseYml('object', yml)

    const replacePlaceholder = (str: string) =>
      replacePlaceholders(str, this?.config?.toJSON())

    if (u.isObj(cadlEndpointObj)) {
      const cadlEndpoint = this.cadlEndpoint

      for (let [key, value] of u.entries(cadlEndpointObj)) {
        if (key === 'preload') {
          cadlEndpoint.getPreload().push(...value)
        } else if (key === 'page' || key === 'pages') {
          cadlEndpoint.getPages().push(...value)
        } else {
          this.cadlEndpoint?.set?.(key, replacePlaceholder(value))
        }
      }
    }

    if (options?.includePreload) {
      inv(
        !u.isUnd(options.root),
        `Root object must be provided when loading cadlEndpoint and includePreload === true`,
      )

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
          yml = await fsys.readFile(path.join(options.dir, preload), 'utf8')
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
          yml = await fsys.readFile(path.join(options.dir, page), 'utf8')
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
    }
  }

  constructor() {
    super()
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
      fs?: any
      mode?: 'url' | 'file'
      overwrite?: boolean
      onCadlEndpointError?: (error: Error) => void
      includePreload?: boolean
      includePages?: boolean
    } = {},
  ) {
    const { overwrite = false } = options || {}
    const fsys = (options?.fs || fs) as typeof fs

    const loadYml = (v: string) => {
      switch (options?.mode) {
        case 'file':
          return loadFile(v, 'yml')
        default:
          return fetchYml(v, 'yml')
      }
    }

    if (is.configKey(this.configKey, value)) {
      const yml = await loadYml(create.configUri(value))
      console.log({ yml: create.configUri(value) })

      await loadConfig.call(this, yml, options)
    } else if (is.appKey(this.appKey, value)) {
      await loadCadlEndpoint.call(this, await loadYml(value), options)
    } else if (is.url(value)) {
      //
    } else if (is.file(value)) {
      //
    }

    if (
      options?.dir &&
      (!path.isAbsolute(options.dir) || options?.dir?.startsWith('./'))
    ) {
      options.dir = path.resolve(options.dir)
    }

    const loadOptions = {
      includePreload: u.isBool(options?.includePreload)
        ? options.includePreload
        : true,
      includePages: u.isBool(options?.includePages)
        ? options.includePages
        : true,
      cadlEndpoint: this.cadlEndpoint,
      config: this.config,
      dir: options?.dir,
      fs: options?.fs || fs,
      mode: options?.mode,
      root: this.root,
    }

    const getLoadConfigOptions = () => ({
      ...loadOptions,
      onCadlEndpointError: options?.onCadlEndpointError,
    })

    const getLoadCadlEndpointOptions = () => loadOptions

    const handleConfigOrCadlEndpoint = async (
      type: 'config' | 'cadlEndpoint',
      yml: string,
    ) => {
      try {
        const isConfigKey = type === 'config'
        const fn = isConfigKey ? loadConfig : loadCadlEndpoint
        await fn.call(
          this,
          yml,
          isConfigKey ? getLoadConfigOptions() : getLoadCadlEndpointOptions(),
        )
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error))
      }
    }

    const handlePreloadOrPage = async (name: string, yml: string) => {
      try {
        const isPreload = this.cadlEndpoint.preloadExists(name)
        const isPage = this.cadlEndpoint.pageExists(name)
        const doc = toDocument(yml)
        if (isPreload) {
          inv(
            y.isMap(doc.contents),
            `Expected a YAMLMap for preload but received ${getNodeTypeLabel(
              doc.contents,
            )}`,
          )
          spreadToRoot(this.root, doc.contents)
        } else if (isPage) {
          this.root[name] = doc
        } else {
          throw new Error(
            `"${value}" (name: ${quoteIfEmptyStr(
              name,
            )}) returned an empty value`,
          )
        }
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error))
      }
    }

    try {
      if (!value) return
      if (u.isStr(value)) {
        // If just config key, load by remote url UNLESS mode === 'file'
        if (is.configKey(this.configKey, value)) {
          let errMsg = 'Root config url is missing. '
          errMsg += 'Cannot load config with config key '
          errMsg += `"${this.configKey}"`
          inv(this.config.rootConfigUrl, errMsg)

          let pathname = toPathname(ensureSuffix('.yml', value))
          let yml = ''

          if (options?.mode === 'file') {
            const dir = options?.dir || ''
            yml = (await (options?.fs || fs)).readdir(dir, 'utf8')
          } else {
            const url = `${this.config.rootConfigUrl}${pathname}`
            yml = await fetchYml(url)
          }

          return void (await loadConfig.call(this, yml, getLoadConfigOptions()))
        }

        if (is.appKey(this.appKey, value)) {
          const pathname = ensureSuffix('.yml', value)
          const url = `${this.config.get('cadlBaseUrl')}${pathname}`
          const yml = await fetchYml(url)
          return void (await loadCadlEndpoint.call(
            this,
            yml,
            getLoadCadlEndpointOptions(),
          ))
        }

        // If url, fetch yml remotely
        if (is.url(value)) {
          const name = path.parse(value).name || ''
          inv(name, `The name extracted from "${value}" was empty`)

          const isConfigKey = is.configKey(this.configKey, name)
          const isAppKey = is.appKey(this.appKey, name)

          if (isConfigKey || isAppKey) {
            await handleConfigOrCadlEndpoint(
              isConfigKey ? 'config' : 'cadlEndpoint',
              await fetchYml(value),
            )
          } else {
            await handlePreloadOrPage(name, await fetchYml(value))
          }
        }

        // If directory, use loader.config.configKey to search for a directory that has it, and load the app using config -> cadlEndpoint -> preload -> page
        else if (is.file(value)) {
          try {
            if (!path.isAbsolute(value)) value = path.resolve(value)
            const name = path.parse(value).name

            if (name in this.root && !overwrite) return

            const isConfigKey = is.configKey(this.configKey, name)
            const yml = await fsys.readFile(value, 'utf8')

            if (isConfigKey || is.appKey(this.config.appKey, value)) {
              await handleConfigOrCadlEndpoint(
                isConfigKey ? 'config' : 'cadlEndpoint',
                yml,
              )
            } else {
              await handlePreloadOrPage(name, yml)
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
          const isConfigKey = is.configKey(this.config.configKey, value)

          if (isConfigKey || is.appKey(this.config.appKey, value)) {
            await handleConfigOrCadlEndpoint(
              isConfigKey ? 'config' : 'cadlEndpoint',
              isConfigKey
                ? joinPaths(this.config.rootConfigUrl, this.config.configKey)
                : `${this.cadlEndpoint.getURL(this.config.appKey, 'page')}`,
            )
          } else if (
            this.cadlEndpoint.preloadExists(value) ||
            this.cadlEndpoint.pageExists(value)
          ) {
            await handlePreloadOrPage(
              value,
              await fetchYml(this.cadlEndpoint.getURL(value)),
            )
          } else {
            throw new Error(
              `"${value}" could not be identified as a config, cadlEndpoint, preload, or page`,
            )
          }
        }
      } else {
        //
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error))
    }
  }
}

export default NoodlLoader

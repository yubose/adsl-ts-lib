import axios from 'axios'
import * as u from '@jsmanifest/utils'
import fs from 'fs-extra'
import path from 'path'
import set from 'lodash/set'
import type { Logger } from 'winston'
import * as t from './types'

/**
 * Replaces backlashes for windows support
 */
const normalizePath = (s: string) => s.replace(/\\/g, '/')

const regex = {
  cadlBaseUrlPlaceholder: /\${cadlBaseUrl}/,
  cadlVersionPlaceholder: /\${cadlVersion}/,
  designSuffixPlaceholder: /\${designSuffix}/,
}

async function downloadFile(
  log: Logger,
  url: string,
  filename: string,
  dir: string,
) {
  try {
    const destination = path.join(dir, filename)
    log.debug(`Downloading ${url} to ${destination}`)
    const { data } = await axios.get(url, { responseType: 'text' })
    await fs.writeFile(destination, data, 'utf8')
    return data
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    // log.error(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
    if ('response' in err) {
      if (err['response']?.['status'] === 404) {
        log.warn(`The file "${url}" returned a ${u.red(`404 Not Found`)} error`)
      }
    } else {
      throw err
    }
  }
}

function getConfigUrl(configKey = 'aitmed') {
  return `https://public.aitmed.com/config/${ensureExt(configKey, 'yml')}`
}

function configDirExists(baseDir: string | null, configKey: string) {
  const filepath = getConfigDir(configKey)
  console.log(`Checking if ${filepath} exists`)
  return fs.existsSync(getConfigDir(configKey))
}

function ensureExt(value = '', ext = 'yml') {
  if (!u.isStr(value)) return value
  if (value === '') return `.${ext}`
  if (value.endsWith(`.${ext}`)) return value
  if (value.endsWith('.')) return `${value}${ext}`
  return `${value}.${ext}`
}

async function fetchYml(url = '') {
  console.log(`Fetching ${url}`)
  return axios.get(url).then((resp) => resp.data)
}

function removeExt(str: string, ext = 'yml') {
  return path.basename(str, `.${ext}`)
}

function getAssetFilePath(srcPath: string, filename: string) {
  console.log(
    `Getting asset path using src "${srcPath}" and file name "${filename}"`,
  )
  return u.unixify(path.join(srcPath, `./${filename}`))
}

function getConfigDir(configKey: string, cwd = process.cwd()) {
  console.log(
    `Getting config directory using config key "${configKey}" from cwd ${cwd}`,
  )
  return u.unixify(path.join(cwd, 'output', removeExt(configKey, 'yml')))
}

const utils = {
  configDirExists,
  downloadFile,
  ensureExt,
  fetchYml,
  getAssetFilePath,
  getConfigDir,
  getConfigUrl,
  getConfigVersion: (config: any, env = 'stable') =>
    config?.web?.cadlVersion?.[env],
  normalizePath,
  removeExt,
  regex,
}

export class Metadata {
  #store = new Map();

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  clear() {
    this.#store.clear()
    return this
  }

  get(key: string) {
    return this.#store.get(key)
  }

  set(key: string, value: any) {
    this.#store.set(key, value)
    return this
  }

  setOrCreate(key: string, value: any) {
    if (!this.#store.has(key)) {
      // const
    } else {
      const val = this.#store.get(key)
      if (u.isArr(val) || u.isObj(val)) {
        set(val, key, value)
      }
      // this.#store.set()
    }
  }

  remove(key: string) {
    this.#store.delete(key)
    return this
  }

  toJSON() {
    const metadata = {
      appKey: this.get('appKey') as string,
      cacheDirectory: this.get('cacheDirectory'),
      cwd: this.get('cwd'),
      configKey: this.get('configKey'),
      configUrl: this.get('configUrl'),
      deviceType: this.get('deviceType'),
      ecosEnv: this.get('ecosEnv'),
      existingFilesInAppDirectory: this.get(
        'existingFilesInAppDirectory',
      ) as string[],
      extractedAssets: this.get('extractedAssets') as string[],
      loader: this.get('loader') as {
        appConfigUrl?: string
        options?: {
          config?: string
          dataType?: 'map' | 'object'
          deviceType?: string
          env?: string
          loglevel?: string
          version?: string
        }
        loadRootConfigOptions?: {
          dir?: string
          config?: string
        }
        loadAppConfigOptions?: {
          dir?: string
          fallback?: {
            type?: 'download'
            appConfigUrl?: string
            appDir?: string
            filename?: string
          }
        }
      },
      loglevel: this.get('loglevel') as
        | 'info'
        | 'trace'
        | 'debug'
        | 'warn'
        | 'error'
        | 'silent'
        | undefined,
      paths: this.get('paths') as t.GatsbyNoodlPluginOptions['paths'] & {
        app?: {
          assetsDir?: string
          cadlEndpoint?: string
          config?: string
          dir?: string
          pages?: {
            [pageName: string]: {
              dir?: string
              components?: string
              context?: string
            }
          }
        }
      },
      fetched: this.get('fetched') as string[],
      sdk: this.get('sdk') as {
        assetsUrl?: string
        baseUrl?: string
        cadlEndpoint?: Record<string, any>
      },
      viewport: this.get('viewport') as { width: number; height: number },
    }

    return metadata as typeof metadata & Record<string, any>
  }

  toString(minify = false) {
    const args = (minify ? [] : [null, 2]) as [null, number]
    return JSON.stringify(this.toJSON(), ...args)
  }
}

export default utils

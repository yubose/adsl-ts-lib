import axios from 'axios'
import * as u from '@jsmanifest/utils'
import fs from 'fs-extra'
import path from 'path'
import type { Logger } from 'winston'

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
      if (err['response']?.status === 404) {
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

function configDirExists(baseDir, configKey) {
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
  getConfigVersion: (config, env = 'stable') => config?.web?.cadlVersion?.[env],
  normalizePath,
  removeExt,
  regex,
}

export default utils

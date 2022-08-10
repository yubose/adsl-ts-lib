import path from 'path'
import * as u from '@jsmanifest/utils'

export function configKey(value: string | null | undefined) {
  if (!u.isStr(value)) return String(value)
  value = value.replace(/(_en|\.yml$)/g, '')
  return value
}

export function appKey(value: string | null | undefined) {
  return configKey(value)
}

export function ensureSuffix(suffix: string, value = '') {
  if (!value.endsWith?.(suffix)) value += suffix
  return value
}

export function endpoint(...paths: string[]) {
  let current = [...paths]
  let endpoint = ''

  while (current.length) {
    let nextPath = current.shift()

    if (endpoint === '') {
      if (nextPath?.startsWith('http')) {
        endpoint += nextPath
        continue
      }
    }

    if (nextPath) {
      if (endpoint.endsWith('/')) {
        endpoint = endpoint.substring(0, endpoint.length - 1)
      }

      if (!nextPath.startsWith('/')) nextPath = `/${nextPath}`

      endpoint += nextPath
    }
  }

  return endpoint
}

export function joinPaths(...paths: any[]) {
  return path.join(...paths.map(String))
}

export function pageName(value: string | null | undefined) {
  return configKey(value)
}

export function quoteIfEmptyStr(value: any) {
  return value === '' ? "''" : value
}

export function toPathname(value: string | null | undefined): string {
  if (!u.isStr(value)) return '/' + String(value)
  if (!value.startsWith('/')) value = `/${value}`
  return value
}

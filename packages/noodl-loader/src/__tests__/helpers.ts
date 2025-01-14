import type { LiteralUnion } from 'type-fest'
import y from 'yaml'
import set from 'lodash/set'
import { fs, vol } from 'memfs'
import { fp, is as coreIs } from 'noodl-core'
import { actionFactory, componentFactory } from 'noodl-test-utils'
import path from 'path'
import nock from 'nock'
import {
  configKey as toConfigKey,
  ensureSuffix,
  endpoint as toEndpoint,
  toPathname,
} from '../utils/format'
import { hasPlaceholder, getPlaceholderValues } from '../utils/parse'
import { replacePlaceholders } from '../utils/replace'
import { parseAs, toJson } from '../utils/yml'
import FileSystemHost from '../file-system'
import type Loader from '../loader'
import * as t from '../types'
import * as c from '../constants'

export const baseUrl = 'http://127.0.0.1:3001/'
export const assetsUrl = `${baseUrl}assets`
export const configKey = 'meetd2'
export const ui = { ...actionFactory, ...componentFactory } as const

export type PageNameYmlTuple<As extends t.As> = [
  name: string,
  ymlOrJson: As extends 'doc'
    ? y.Document<y.Node<any>>
    : As extends 'json'
    ? Record<string, any>
    : string,
]

export type PageOption<As extends t.As> = string | PageNameYmlTuple<As>

export type PageOptionResult = { name: string; yml: string }

type CreateConfigProps = Record<LiteralUnion<t.KeyOfConfig, string>, any>

export function createConfigUri(str: string) {
  return `${c.baseRemoteConfigUrl}/${ensureSuffix('.yml', str)}`
}

export function createConfig(
  configKey: string,
  options?: Partial<CreateConfigProps>,
): {
  configKey: string
} & t.ParsedAs<'json'>

export function createConfig<As extends t.As>(
  as: As,
  options?: Partial<CreateConfigProps>,
): t.ParsedAs<As>

export function createConfig(options?: Partial<CreateConfigProps>): string

export function createConfig(
  arg1?: LiteralUnion<t.As, string> | Partial<CreateConfigProps>,
  arg2?: Partial<CreateConfigProps>,
) {
  let as = 'yml' as t.As
  let props = {} as Partial<CreateConfigProps>
  let configKey = null as null | string

  if (coreIs.str(arg1)) {
    if (['doc', 'json', 'yml'].some((_as) => _as === arg1)) {
      as = arg1 as t.As
    } else {
      as = 'json'
      configKey = arg1
    }

    if (coreIs.obj(arg2)) {
      fp.assign(props, arg2)
    }
  } else if (coreIs.obj(arg1)) {
    fp.assign(props, arg1)
  }

  if (configKey) props.configKey = configKey

  return parseAs(as, {
    apiHost: '',
    apiPort: '',
    webApiHost: null,
    appApiHost: null,
    debug: null,
    cadlBaseUrl: '',
    cadlMain: 'cadlEndpoint.yml',
    timestamp: null,
    myBaseUrl: '',
    fileSuffix: null,
    ...props,
  })
}

type CreateCadlEndpointProps = Record<
  LiteralUnion<t.KeyOfCadlEndpoint | 'placeholders', string>,
  any
>

export function createCadlEndpoint<As extends t.As>(
  as: As,
  options?: Partial<CreateCadlEndpointProps>,
): t.ParsedAs<As>

export function createCadlEndpoint(
  options?: Partial<CreateCadlEndpointProps>,
): string

export function createCadlEndpoint(
  arg1?: t.As | Partial<CreateCadlEndpointProps>,
  arg2?: Partial<CreateCadlEndpointProps>,
) {
  let as = 'yml' as t.As
  let props = {} as CreateCadlEndpointProps
  let placeholders = {}

  if (coreIs.str(arg1)) {
    as = arg1
    fp.assign(props, arg2)
  } else {
    const { placeholders: _placeholders = {}, ...rest } = arg1 || {}
    fp.assign(props, rest)
    fp.assign(placeholders, _placeholders)
  }

  const cadlEndpoint = {
    assetsUrl: '${cadlBaseUrl}assets',
    baseUrl: '${cadlBaseUrl}',
    preload: [],
    page: [],
  }

  for (const [key, value] of fp.entries(props)) {
    if (key === 'pages') {
      // @ts-expect-error
      cadlEndpoint.page.push(...value)
    } else {
      cadlEndpoint[key] = coreIs.str(value)
        ? replacePlaceholders(value, placeholders)
        : value
    }
  }

  fp.assign(props, cadlEndpoint)

  return parseAs(as, props)
}

type LoadFileProps = Parameters<Loader['load']>[1] & { dir?: string }

export function getLoadFileOptions(options?: Partial<LoadFileProps>) {
  let dir = ''
  return {
    mode: 'file',
    ...options,
    dir: dir || `generated/${configKey}`,
    fs: {
      ...fs,
      readFile: fs.readFileSync,
      readdir: fs.readdirSync,
    },
  } as LoadFileProps
}

export function nockRequest(
  urlOrBaseURL: string,
  pathnameOrResponse: string | Record<string, any>,
  response?: string | Record<string, any>,
) {
  let _baseURL = ''
  let _pathname = ''
  let _response = ''

  if (response !== undefined) {
    _baseURL = urlOrBaseURL
    _pathname = toPathname(pathnameOrResponse as string)
    _response = parseAs('yml', response)
  } else {
    _baseURL = baseUrl
    _pathname = toPathname(urlOrBaseURL)
    _response = parseAs('yml', pathnameOrResponse)
  }

  nock(_baseURL)
    .get(
      new RegExp(
        _pathname.startsWith('/') ? _pathname.substring(1) : _pathname,
      ),
    )
    .reply(200, parseAs('yml', _response))
  const endpoint = toEndpoint(_baseURL, _pathname)
  return endpoint
}

type NockConfigRequestProps = Record<
  LiteralUnion<t.KeyOfConfig | 'configKey', string>,
  any
>

export function nockConfigRequest(): string
export function nockConfigRequest(
  configKey: string | Partial<NockConfigRequestProps>,
): string
export function nockConfigRequest(
  arg: string | Partial<NockConfigRequestProps> = 'meetd2',
) {
  let configKey = ''
  let options = {} as NockConfigRequestProps

  if (coreIs.str(arg)) {
    configKey = arg
    options.cadlBaseUrl = baseUrl
  } else if (coreIs.obj(arg)) {
    const { configKey: _configKey, ...rest } = arg
    configKey = toConfigKey(_configKey)
    fp.merge(options, rest)
    if (!options.cadlBaseUrl) options.cadlBaseUrl = baseUrl
  }

  return nockRequest(
    c.baseRemoteConfigUrl,
    ensureSuffix('.yml', configKey),
    createConfig(options),
  )
}

type NockCadlEndpointResult = {
  baseUrl: string
  filename: string
  preload: string[]
  pages: string[]
  yml: string
  endpoint: string
  startPage: string
}

export function nockCadlEndpointRequest(
  preload?: string[],
  pages?: string[],
): NockCadlEndpointResult

export function nockCadlEndpointRequest(
  props?: Partial<CreateCadlEndpointProps>,
): NockCadlEndpointResult

export function nockCadlEndpointRequest(
  arg1?: string[] | Partial<CreateCadlEndpointProps>,
  arg2?: string[],
) {
  let _options = {
    assetsUrl,
    baseUrl,
    fileSuffix: '.yml',
    languageSuffix: { en: 'en_US' },
    preload: [],
    page: [],
    startPage: '',
  } as CreateCadlEndpointProps

  let filename = 'cadlEndpoint.yml'

  if (coreIs.arr(arg1)) {
    if (arg1.length) {
      _options.preload.push(...fp.toArr(arg1))
    }
    if (arg2) {
      _options.page.push(...fp.toArr(arg2))
    }
  } else if (coreIs.obj(arg1)) {
    for (const [key, value] of fp.entries(arg1)) {
      if (key === 'pages') {
        _options.page = fp.toArr(value)
      } else {
        _options[key] = value
      }
    }
  }

  const yml = createCadlEndpoint(_options)
  const endpoint = nockRequest(baseUrl, filename, yml)

  const result: NockCadlEndpointResult = {
    baseUrl,
    filename,
    preload: _options.preload,
    pages: _options.page,
    yml,
    endpoint,
    startPage: _options.startPage || '',
  }

  return result
}

export function createMockEndpoints(
  options: {
    baseUrl?: string
    assetsUrl?: string
    cadlMain?: string
    configKey?: PageOption<t.As>
    preload?: PageOption<t.As> | PageOption<t.As>[]
    pages?: PageOption<t.As> | PageOption<t.As>[]
    placeholders?: Record<string, any>
    startPage?: string
  } = {},
) {
  const _baseUrl = options.baseUrl || baseUrl
  const _assetsUrl = options.assetsUrl || `${_baseUrl}assets`
  const _configKey = options.configKey || configKey
  const _appKey = options.cadlMain || 'cadlEndpoint.yml'
  const _preload = options.preload || []
  const _pages = options.pages || []
  const _placeholders = options.placeholders || {}

  const extract = <As extends t.As = 'yml'>(
    value: undefined | PageOption<As> | PageOption<As>,
    as?: As,
  ): PageNameYmlTuple<As> => {
    if (coreIs.str(value))
      return [
        value,
        as === 'json' ? {} : as === 'doc' ? null : '',
      ] as PageNameYmlTuple<As>
    if (coreIs.arr(value)) {
      return [
        value[0] as string,
        parseAs(as || 'yml', value[1]),
      ] as PageNameYmlTuple<As>
    }
    return [value?.[0] || ('' as string), ''] as PageNameYmlTuple<As>
  }

  const endpoints = {} as Record<
    string,
    {
      endpoint: string
      filename: string
      response: any
    }
  >

  const createEndpoint = (
    path: string | string[] = '',
    filename: string,
    response: any = '',
  ) => {
    if (!coreIs.arr(path)) path = path.split('.')
    let endpoint = toEndpoint(path.join('.'), toPathname(filename))
    if (hasPlaceholder(endpoint)) {
      const values = getPlaceholderValues(endpoint, _placeholders)
      endpoint = replacePlaceholders(endpoint, values)
    }
    const result = { endpoint, filename, response }
    endpoints[endpoint] = result
    return result
  }

  const createYmlEndpoint = (
    path: string | string[],
    filename: string,
    response: any = '',
  ) => {
    return createEndpoint(path, ensureSuffix('.yml', filename), response)
  }

  let [configName, configYml] = extract(_configKey)

  if (!configYml) {
    configYml = createConfig({ cadlMain: _appKey, cadlBaseUrl: _baseUrl })
  }

  const configJson = toJson(configYml)
  const preloadNames = [] as string[]
  const pageNames = [] as string[]

  for (const [value, list] of [
    [_preload, preloadNames],
    [_pages, pageNames],
  ] as const) {
    if (coreIs.arr(value) && !value.length) continue
    fp.toArr(value).forEach((val) => {
      const [name, yml] = extract(val as any)
      list.push(name)
      createYmlEndpoint(_baseUrl, name, yml)
    })
  }

  const startPage = options.startPage || pageNames[0] || ''

  createYmlEndpoint(c.baseRemoteConfigUrl, configName, configYml)

  const [cadlEndpointName, cadlEndpointYml] = extract([
    configJson.cadlMain,
    createCadlEndpoint({
      assetsUrl: _assetsUrl,
      baseUrl: _baseUrl,
      preload: preloadNames,
      page: pageNames,
      startPage,
    }),
  ])

  createYmlEndpoint(_baseUrl, cadlEndpointName, cadlEndpointYml)

  return endpoints
}

export interface MockPathsOptions {
  appKey?: string
  baseUrl?: string
  assetsUrl?: string
  configKey?: PageOption<t.As> | ({ configKey: string } & Record<string, any>)
  preload?: PageOption<t.As> | PageOption<t.As>[]
  pages?: PageOption<t.As> | PageOption<t.As>[]
  placeholders?: Record<string, any>
  startPage?: string
  type?: 'file' | 'url'
}

// TODO - Implement using cadlMain from configYml as appKey if options.appKey is not used
export function mockPaths(options: MockPathsOptions) {
  let configKey = '' as PageOption<t.As>
  let configProps: any

  if (!coreIs.arr(options?.configKey) && coreIs.obj(options?.configKey)) {
    const { configKey: newConfigKey, ...rest } = options?.configKey
    configKey = newConfigKey
    configProps = rest
  } else {
    configKey = options?.configKey as PageOption<t.As>
  }

  let appKey = options?.appKey

  let { name: configName, yml: configYml = '' } = extract(
    configProps && configKey ? [configKey, configProps] : configKey,
  )

  configKey = configName

  const {
    baseUrl: baseUrlProp = baseUrl,
    assetsUrl: assetsUrlProp = assetsUrl,
    placeholders,
    preload = [],
    pages = [],
    startPage,
    type = 'url',
  } = options

  const endpoints = createMockEndpoints({
    assetsUrl: assetsUrlProp,
    baseUrl: baseUrlProp,
    cadlMain: appKey,
    configKey: [configKey, configYml],
    preload,
    pages,
    placeholders,
    startPage,
  })

  function extract(item: undefined | PageOption<t.As> | PageOption<t.As>[]): {
    name: string
    yml: string
  } {
    let name = ''
    let yml = ''

    const setName = (n: any) => (name = n)
    const setYml = (_y: any) => (yml = _y)

    if (coreIs.str(item)) {
      setName(item)
    } else if (coreIs.arr(item)) {
      setName(item[0])
      setYml(parseAs('yml', item[1]))
    } else {
      setName(item?.[0])
    }

    return { name, yml }
  }

  function getMockedFileLoadingPaths(_endpoints: typeof endpoints) {
    const paths = {} as Record<string, any>
    const dir = `generated/${configKey}`
    const createPath = (n: string) =>
      path.join(dir, ensureSuffix('.yml', n)).replace(/\\/g, '/')
    const setPath = (n: string, yml = '') => set(paths, [createPath(n)], yml)
    fp.entries(_endpoints).forEach(([_, o]) => setPath(o.filename, o.response))
    return paths
  }

  function getMockedUrlEndpoints(_endpoints: typeof endpoints) {
    const paths = {} as Record<string, any>
    const createPath = (n: string) => ensureSuffix('.yml', n)
    fp.entries(_endpoints).forEach(([endpoint, o]) => {
      if (endpoint.endsWith(configKey + '.yml')) {
        nockConfigRequest({ configKey, ...y.parse(configYml) })
      } else paths[createPath(o.endpoint)] = o.response || ''
    })
    return paths
  }

  const result = {
    loadType: type,
  } as {
    loadType: 'file' | 'url'
    paths?: Record<string, any>
    endpoints?: Record<string, any>
  }

  if (type === 'file') {
    vol.fromJSON((result.paths = getMockedFileLoadingPaths(endpoints)))
  } else {
    fp.entries((result.endpoints = getMockedUrlEndpoints(endpoints))).forEach(
      ([endpoint, response]) => {
        const pathname = endpoint.substring(endpoint.lastIndexOf('/'))
        const baseUrl = replacePlaceholders(baseUrlProp, placeholders)
        nockRequest(baseUrl, pathname, response)
      },
    )
  }

  return result
}

export class MockFileSystemHost extends FileSystemHost {
  existsSync(filepath: string): boolean {
    return fs.existsSync(filepath)
  }
  readdir(...args: Parameters<FileSystemHost['readdir']>): Promise<string[]> {
    return new Promise((resolve, reject) => {
      return fs.readdir(args[0], 'utf8', (err, data) => {
        if (err) reject(err)
        else resolve(data as string[])
      })
    })
  }

  readdirSync(...args: Parameters<FileSystemHost['readdirSync']>) {
    return fs.readdirSync(args[0], 'utf8') as string[]
  }

  readFile(...args: Parameters<FileSystemHost['readFile']>): Promise<string> {
    return new Promise((resolve, reject) => {
      const opts = { encoding: 'utf8' as BufferEncoding }
      if (args[1] && typeof args[1] === 'object') {
        Object.assign(opts, args[1])
      } else if (typeof args[1] === 'string') {
        opts.encoding = args[1]
      }
      fs.readFile(args[0], { ...opts }, (err, data) => {
        if (err) reject(err)
        else resolve(data as string)
      })
    })
  }

  readFileSync(...args: Parameters<FileSystemHost['readFileSync']>): string {
    return fs.readFileSync(...args) as string
  }

  writeFile(...args: Parameters<FileSystemHost['writeFile']>): Promise<void> {
    return new Promise((resolve, reject) => {
      return fs.writeFile(args[0], args[1], (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }

  writeFileSync(...args: Parameters<FileSystemHost['writeFileSync']>) {
    return fs.writeFileSync(args[0], args[1], (args[2] || 'utf8') as any)
  }
}

/**
 * Reads a file using the memfs module
 *
 * Filepaths are assumed to be proxied/mocked prior to this call via `vol.fromJSON({...})`
 * @param path
 * @param encoding
 */
export function readFile(
  path: string,
  encoding = 'utf8' as any,
): Promise<string> {
  return new Promise((resolve, reject) => {
    return fs.readFile(path, encoding, (err, data) => {
      if (err) reject(err)
      else resolve(data as any)
    })
  })
}

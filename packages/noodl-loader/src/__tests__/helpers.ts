import type { LiteralUnion } from 'type-fest'
import y from 'yaml'
import set from 'lodash/set'
import * as u from '@jsmanifest/utils'
import { fs, vol } from 'memfs'
import path from 'path'
import nock from 'nock'
import {
  configKey as toConfigKey,
  ensureSuffix,
  endpoint as toEndpoint,
  toPathname,
} from '../utils/format'
import { parseAs, toJson } from '../utils/yml'
import type Loader from '../loader'
import * as t from '../types'
import * as c from '../constants'

export const baseUrl = 'http://127.0.0.1:3001/'
export const assetsUrl = `${baseUrl}assets`
export const configKey = 'meetd2'

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

type CreateConfigProps = Record<LiteralUnion<t.KeyOfCadlEndpoint, string>, any>

export function createConfigUri(str: string) {
  return `${c.baseRemoteConfigUrl}/${ensureSuffix('.yml', str)}`
}

export function createConfig<As extends t.As>(
  as: As,
  options?: Partial<CreateConfigProps>,
): t.ParsedAs<As>

export function createConfig(options?: Partial<CreateConfigProps>): string

export function createConfig(
  arg1?: t.As | Partial<CreateConfigProps>,
  arg2?: Partial<CreateConfigProps>,
) {
  let as = 'yml' as t.As
  let props = {} as CreateConfigProps

  if (u.isStr(arg1)) {
    as = arg1
    u.assign(props, arg2)
  } else {
    u.assign(props, arg1)
  }

  const config = {
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
  }

  return parseAs(as, { ...config, ...props })
}

type CreateCadlEndpointProps = Record<
  LiteralUnion<t.KeyOfCadlEndpoint, string>,
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

  if (u.isStr(arg1)) {
    as = arg1
    u.assign(props, arg2)
  } else {
    u.assign(props, arg1)
  }

  const cadlEndpoint = {
    assetsUrl: '${cadlBaseUrl}assets',
    baseUrl: '${cadlBaseUrl}',
    preload: [],
    page: [],
  }

  for (const [key, value] of u.entries(props)) {
    if (key === 'pages') {
      // @ts-expect-error
      cadlEndpoint.page.push(...value)
    } else {
      cadlEndpoint[key] = value
    }
  }

  u.assign(props, cadlEndpoint)

  return parseAs(as, props)
}

type LoadFileProps = Parameters<Loader['load']>[1] & { dir?: string }

export function getLoadFileOptions(options?: Partial<LoadFileProps>) {
  let dir = ''
  return {
    mode: 'file',
    ...options,
    dir: dir || `generated/meetd2`,
    fs: {
      ...fs,
      ...options?.fs,
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

  console.log({
    _baseURL,
    _pathname,
    _response,
    endpoint: toEndpoint(_baseURL, _pathname),
  })

  nock(_baseURL).get(_pathname).reply(200, parseAs('yml', _response))

  return toEndpoint(_baseURL, _pathname)
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

  if (u.isStr(arg)) {
    configKey = arg
    options.cadlBaseUrl = baseUrl
  } else if (u.isObj(options)) {
    const { configKey: _configKey, ...rest } = options
    configKey = toConfigKey(_configKey)
    u.merge(options, rest)
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

  if (u.isArr(arg1)) {
    if (arg1.length) {
      _options.preload.push(...u.array(arg1))
    }
    if (arg2) {
      _options.page.push(...u.array(arg2))
    }
  } else if (u.isObj(arg1)) {
    for (const [key, value] of u.entries(arg1)) {
      if (key === 'pages') {
        _options.page = u.array(value)
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
    configKey?: PageOption<t.As>
    preload?: PageOption<t.As> | PageOption<t.As>[]
    pages?: PageOption<t.As> | PageOption<t.As>[]
  } = {},
) {
  const _baseUrl = options.baseUrl || baseUrl
  const _assetsUrl = options.assetsUrl || `${_baseUrl}assets`
  const _configKey = options.configKey || configKey
  const _preload = options.preload || []
  const _pages = options.pages || []

  const extract = <As extends t.As = 'yml'>(
    value: undefined | PageOption<As> | PageOption<As>,
    as?: As,
  ): PageNameYmlTuple<As> => {
    if (u.isStr(value))
      return [
        value,
        as === 'json' ? {} : as === 'doc' ? null : '',
      ] as PageNameYmlTuple<As>
    if (u.isArr(value)) {
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
    if (!u.isArr(path)) path = path.split('.')
    const endpoint = toEndpoint(path.join('.'), toPathname(filename))
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
    configYml = createConfig({
      assetsUrl: _assetsUrl,
      baseUrl: _baseUrl,
    })
  }

  const configJson = toJson(configYml)
  const preloadNames = [] as string[]
  const pageNames = [] as string[]

  for (const [value, list] of [
    [_preload, preloadNames],
    [_pages, pageNames],
  ] as const) {
    if (u.isArr(value) && !value.length) continue
    u.array(value).forEach((val) => {
      const [name, yml] = extract(val)
      list.push(name)
      createYmlEndpoint(_baseUrl, name, yml)
    })
  }

  const startPage = pageNames[0] || ''

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

export function mockPaths({
  baseUrl: baseUrlProp = baseUrl,
  assetsUrl: assetsUrlProp = assetsUrl,
  configKey: configKeyProp = configKey,
  preload = [],
  pages = [],
  type = 'url',
}: {
  baseUrl?: string
  assetsUrl?: string
  configKey?: PageOption<t.As>
  preload?: PageOption<t.As> | PageOption<t.As>[]
  pages?: PageOption<t.As> | PageOption<t.As>[]
  type?: 'file' | 'url'
}) {
  const { name: configKey, yml: configYml = '' } = extract(configKeyProp)

  const endpoints = createMockEndpoints({
    assetsUrl: assetsUrlProp,
    baseUrl: baseUrlProp,
    configKey,
    preload,
    pages,
  })

  function extract(item: undefined | PageOption<t.As> | PageOption<t.As>[]): {
    name: string
    yml: string
  } {
    let name = ''
    let yml = ''

    const setName = (n: any) => (name = n)
    const setYml = (_y: any) => (yml = _y)

    if (u.isStr(item)) {
      setName(item)
    } else if (u.isArr(item)) {
      setName(item[0])
      setYml(parseAs('yml', item[1]))
    } else {
      setName(item?.[0])
    }

    return { name, yml }
  }

  function getMockedFileLoadingPaths(_endpoints: typeof endpoints) {
    const configKey = configKeyProp
    const paths = {} as Record<string, any>
    const prefix = `generated/${configKey}`
    const createPath = (n: string) => path.join(prefix, ensureSuffix('.yml', n))
    const setPath = (n: string, yml = '') => set(paths, [createPath(n)], yml)
    u.entries(_endpoints).forEach(([_, o]) => setPath(o.filename, o.response))
    return paths
  }

  function getMockedUrlEndpoints(_endpoints: typeof endpoints) {
    const paths = {} as Record<string, any>
    const createPath = (n: string) => `${baseUrlProp}${ensureSuffix('.yml', n)}`
    u.entries(_endpoints).forEach(([endpoint, o]) => {
      if (endpoint.endsWith(configKey + '.yml')) {
        const filename = ensureSuffix('.yml', configKey)
        const pathname = toPathname(filename)
        const path = `${c.baseRemoteConfigUrl}${pathname}`
        paths[path] = configYml
      } else {
        paths[createPath(o.filename)] = o.response || ''
      }
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
    u.entries((result.endpoints = getMockedUrlEndpoints(endpoints))).forEach(
      ([endpoint, response]) => {
        const pathname = endpoint.substring(endpoint.lastIndexOf('/'))
        const baseUrl = endpoint.replace(pathname || '', '')
        nockRequest(baseUrl, pathname, response)
      },
    )
  }

  return result
}

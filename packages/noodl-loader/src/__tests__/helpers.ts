import type { LiteralUnion } from 'type-fest'
import * as R from 'ramda'
import curry from 'lodash/curry'
import y from 'yaml'
import set from 'lodash/set'
import * as u from '@jsmanifest/utils'
import { fs, vol } from 'memfs'
import path from 'path'
import nock from 'nock'
import {
  appKey as toAppKey,
  configKey as toConfigKey,
  ensureSuffix,
  endpoint as toEndpoint,
  toPathname,
} from '../utils/format'
import { parseAs, stringify, toDoc, toJson, toYml } from '../utils/yml'
import { defaultBaseUrl } from './test-utils'
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

/**
 * @deprecated
 */
export function loadPageFixtures<S extends string>(
  dir: string,
  ...pages: S[]
): Record<S, any> {
  if (!pages.length) {
    pages.push(
      ...(fs
        .readdirSync(path.join(process.cwd(), 'src/__tests__/fixtures'))
        // @ts-expect-error
        .filter(
          (filepath) => filepath.endsWith('.yml') && !/Base/.test(filepath),
        ) as S[]),
    )
  }
  return pages.reduce((acc, pageName) => {
    acc[pageName] = fs.readFileSync(path.join(dir, pageName), 'utf8')
    return acc
  }, {} as Record<S, any>)
}

/**
 * @deprecated
 */
export function loadMockedFixtures() {
  const meetd2 = `apiHost: albh2.aitmed.io
apiPort: '443'
webApiHost: apiHost
appApiHost: apiHost
web:
  cadlVersion:
    stable: 0.7d
    test: 0.7d
cadlBaseUrl: https://public.aitmed.com/cadl/www\${cadlVersion}\${designSuffix}/
cadlMain: cadlEndpoint.yml
timestamp: 07082022PDT
keywords:
  - telemedicine`

  const cadlEndpoint = `baseUrl: \${cadlBaseUrl}
assetsUrl: \${cadlBaseUrl}assets/
languageSuffix:
  zh_CN: _cn
  es_ES: _es
  unknown: _en
fileSuffix: .yml
startPage: SignIn
preload:
  - BasePage
  - BaseCSS
  - BaseDataModel
page:
  - AboutAitmed
  - AddContact
  - DocumentNotes
  - EditContact
  - EditMyDocument
  - ReferenceTest
  - SignIn
`

  const AboutAitmed = `AboutAitmed:
init: ''
title: 'About'
components:
  - type: view
    style:
      width: '1'
      height: '1'
    children:
      - .BaseHeader3: null
      - .HeaderLeftButton: null
      - type: label
        text: About AiTmed
        style:
          left: '0.1'
          textAlign:
            x: center
          color: '0x6DACDA'
          border:
            style: '2'
      - type: label
        style:
          marginTop: '0.03'
          textAlign: justify
        textBoard:
          - text:
              AiTmed began in 2015 as a telemedicine platform. In 2019 it developed its
              own ECOS (Edge Computing Operating System) platform, which is
              integrating blockchain encryption and artificial intelligence
              technology.
`

  const AddContact = `AddContact:
pageNumber: '360'
title: 'Add Contact'
init:
  - .SignInCheck
save:
  - =.AddContact.newContact.docAPI.store: ""
`

  const BaseCSS = `Style:
top: "0"
left: "0"
width: "1"
height: "1"
fontSize: "15"
textAlign:
  x: center
color: "0x000000ff"
borderWidth: "0"
shadow: "false"
ImageStyle:
.Style:
  border:
    style: "1"
  objectFit: cover
LabelStyle:
.Style:
  display: inline
  textAlign:
    x: left
    y: center`

  const BaseDataModel = `VoidObj: vVoOiIdD # {}
EmptyObj: "" # {""} FALSE
EcosObj:
  id: "" # base64 id
  name: "" # JSON string
  type: "0" # data type
  ctime: "0" # Unix_TimeStamp when data created.
Vertex:
  .EcosObj: "" # inherit an object value only, not the key
  uid: ""
  pk: ""
  esk: ""
  deat: ""
VertexAPI:
  get:
    api: rv
  store:
    api: cv
Edge:
  .EcosObj: ""
  subtype: ""
  bvid: ""
  evid: ""
  ctime: ""
  tage: ""
EdgeAPI:
  get:
    api: re
    xfname: bvid
    maxcount: "1"
  store:
    api: ce
Document:
  .EcosObj: ""
  eid: "" #EDGE ID
  fid: "" #
  subtype:
    isOnServer: "1" # 1 ECOS server and limited size after compression under 32k;  0  S3
    isZipped: auto # 0 not gziped  1  gziped
    isBinary: "0" # 0 Base64       1  binary
    isEncryped: "0" #0 no         1  encryped
    isExtraKeyNeeded: "0" #0 no   1  yes
    isEditable: "0" #0  no        1  yes
    isCached: "1"
    applicationDataType: "0" #0 data
    mediaType: "0" # 0 others
    size: auto
DocAPI:
  get:
    api: rd
    ids: "" #
    xfname: "" # default is "id", optional "eid", "fid"
    type: "0" # 0 data application data type 0 - 1023
    maxcount: "1" # default is 20, max 1000
  store:
    api: cd
`

  const BasePage = `BasePage:
pageNumber: "0"
LeftBackButton:
type: button
onClick:
  - actionType: builtIn
    funcName: goBack
style:
  left: "0.03"
  top: "0.025"
  width: "0.15"
  height: "0.05"
  backgroundColor: "0x388eccff"
children:
  - type: image
    path: backWhiteArrow.png
    style:
      left: "0.02"
      top: "0.01"
      width: "0.04"
      height: "0.02"
  - type: label
    text: Back
    style:
      left: "0.08"
      top: "0"
      width: "0.08"
      height: "0.04"
      fontSize: "12"
      color: "0xffffffff"
      textAlign:
        x: left
        y: center
BaseHeader:
type: header
style:
  left: "0"
  top: "0"
  width: "1"
  height: "0.1"
  backgroundColor: "0x388eccff"
children:
  - type: button
    text: =..title
    style:
      left: "0.3"
      width: "0.4"
      top: "0"
      fontWeight: 300
      backgroundColor: "0x388eccff"
      height: "0.1"
      fontSize: "18"
      color: "0xffffffff"
      textAlign:
        x: center
HeaderRightImg:
type: image
path: "sideNav2.png"
style: .HeaderRightImgStyle
HeaderRightImg1:
type: image
style:
  left: "0.87"
  top: "0.036"
  height: "0.028"
  zIndex: "10000"
`

  const DocumentNotes = `DocumentNotes:
pageNumber: '180'
title: 'Meeting Notes'
init:
  - .SignInCheck
  - actionType: evalObject
    object: .DocumentNotes.docDetail.document@: =.Global.DocReference.document
save:
  - =.DocumentNotes.docDetail.docAPI.delete: ""
`

  const EditContact = `EditContact:
  pageNumber: "390" # xd page 40
  title: "Edit Contact"
  init:
    - .SignInCheck
    - actionType: evalObject
      object:
        .EditContact.contactInfo.document@: =.Global.DocReference.document
  save:
    - =.EditContact.contactInfo.docAPI.store: ""
`

  const EditMyDocument = `EditMyDocument:
pageNumber: "524" # xd page 28
title: "Edit My Documents"
init:
  - .SignInCheck
  - actionType: evalObject
    object:
      .EditMyDocument.docDetail.document@: =.Global.DocReference.document
  - =.EditMyDocument.signData.docAPI.get: ""
  - if:
      - =.EditMyDocument.signData.doc.0
      - actionType: evalObject
        object:
          =.builtIn.utils.prepareDoc:
            dataIn:
              doc: =..signData.doc.0
            dataOut: EditMyDocument.signData.doc.0
      - continue
save:
  - =.EditMyDocument.docDetail.docAPI.store: ""
update:
  - =.EditMyDocument.docDetail.docAPI.delete: ""
`

  const ReferenceTest = `ReferenceTest:
pageNumber: '524'
title: 'The Page for ReferenceTest tests'
docDetail:
  document:
    name:
      title: document title
      data: binFile
      type: image/png
      countryCodes: .CountryCode # --> .CountryCode
avatar: 'https://public.aitmed.com/avatar/JohnDoe.jpg'
demographics:
  gender:
    options:
      - male
      - female
      - other
components:
  - .HeaderLeftButton: # --> .HeaderLeftButton --> .LeftButtonStyle --> .Style
    style:
      left: '0'
      height: '0.4'
  - type: view
    children:
      - type: textField
        dataKey: docDetail.document.name.title
        style:
          color: '0x000000'
          borderWidth: '1'
      - type: view
        children:
          - type: label
            text: 'Shared by: '
            style:
              top: '0.015'
          - type: label
            dataKey: docDetail.document.name.user
      - type: ecosDoc
        ecosObj: ..docDetail.document
      - type: button
        text: 'Save'
        onClick:
          - actionType: builtIn
            funcName: goBack
            reload: true
        style:
          backgroundColor: '0x388eccff'
          borderRadius: '5'
      - type: view
        style:
          border:
            style: '4'
            width: '1.5'
            color: '0xacacac'
        children:
          - type: select
            initialValue: ..demographics.gender.options.1
            options: ..demographics.gender.options
            style:
              left: '0'
              width: '0.7'
              height: '0.12'
      - type: popUp
        viewTag: removeView
        style:
        children:
          - type: view
            style:
              backgroundColor: '0xeeeeeeff'
              borderRadius: '15'
            children:
              - type: label
                text: 'Are you sure you want to remove this note?'
              - type: divider
              - type: button
                onClick:
                  - actionType: builtIn
                    funcName: goBack
                    reload: true
                text: Remove
                style:
                  display: inline
                  textAlign:
                    x: center
                    y: center
                  borderRadius: '15'
`

  const SignIn = `SignIn:
  pageNumber: "30"
  init:
    - if:
        - .builtIn.isIOS # 'true', 'false'
        - actionType: evalObject
          object: ..setIOS
        - continue
    - if:
        - .builtIn.isAndroid # 'true', 'false'
        - actionType: evalObject
          object: ..setAndroid
        - continue
    - if:
        - =..appLink.url
        - goto: ..appLink.url
        - continue
    - if:
        - =.Global.currentUser.vertex.sk #.builtIn.SignInOk
        - goto: MeetingRoomInvited
        - continue
`

  const files = {
    [`generated/meetd2/meetd2.yml`]: meetd2,
    [`generated/meetd2/cadlEndpoint.yml`]: cadlEndpoint,
    [`generated/meetd2/AboutAitmed.yml`]: AboutAitmed,
    [`generated/meetd2/AddContact.yml`]: AddContact,
    [`generated/meetd2/BaseCSS.yml`]: BaseCSS,
    [`generated/meetd2/BaseDataModel.yml`]: BaseDataModel,
    [`generated/meetd2/BasePage.yml`]: BasePage,
    [`generated/meetd2/DocumentNotes.yml`]: DocumentNotes,
    [`generated/meetd2/EditContact.yml`]: EditContact,
    [`generated/meetd2/EditMyDocument.yml`]: EditMyDocument,
    [`generated/meetd2/ReferenceTest.yml`]: ReferenceTest,
    [`generated/meetd2/SignIn.yml`]: SignIn,
    [`package.json`]: '',
    [`tsconfig.json`]: '',
  }

  vol.fromJSON(files)

  return files
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
    _baseURL = defaultBaseUrl
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

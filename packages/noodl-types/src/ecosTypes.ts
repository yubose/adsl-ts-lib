import type { LiteralUnion } from 'type-fest'
import type { EmitObjectFold, IfObject } from './uncategorizedTypes'
import type { OrArray } from './_internal/types'

export type RootConfig = Record<DeviceType, RootConfigDeviceVersionObject> & {
  /**
   * @example
   * ```json
   * { "apiHost": "albh2.aitmed.io" }
   * ```
   */
  apiHost: string
  /**
   * @example
   * ```
   * const apiPort = '443'
   * ```
   */
  apiPort: string | number
  /**
   * Can be a variable (example: apiHost which re-uses the value of
   * "apiHost" in the config)
   */
  webApiHost: string
  /**
   * Can be a variable (example: apiHost which re-uses the value of
   * "appApiHost" in the config)
   */
  appApiHost: string
  /**
   * Base url that links in relative format will resolve from
   * For example, if cadlBaseUrl is "http://127.0.0.1:3000", a page referenced
   * in a noodl object like "SignIn" will resolve to:
   * "http://127.0.0.1:3000/SignIn"
   */
  cadlBaseUrl: string
  myBaseUrl: string
  connectiontimeout: number | string
  loadingLevel: number // Defaulted to 1
  /**
   * The file name/path will be the pathname used to grab the "app" config
   * For example, if cadlMain is "cadlEndpoint.yml", the app should pick up
   * "${cadlBaseUrl}/cadlEndpoint.yml" where ${cadlBaseUrl} is a placeholder
   * for the cadlBaseUrl variable
   * @example
   * ```js
   * const cadlMain = 'cadlEndpoint.yml'
   * ```
   */
  cadlMain: string
  /**
   * Defaults to "console_log_api"
   * @example
   * ```json
   * { "debug": "console_log_api" }
   * ```
   */
  debug: string
  /** If this is specified the app should transform this to a plugin component */
  bodyTopPplugin?: string
  /** If this is specified the app should transform this to a plugin component */
  bodyTailPplugin?: string
  /** If this is specified the app should transform this to a plugin component */
  headPlugin?: string
  platform?: string
  syncHost?: string
  /**
   * The timestamp the config was last created or modified.
   * This is used to invalidate the config cache.
   * @example
   * ```json
   * { "timestamp": "092142419232" }
   * ```
   */
  timestamp: string
  /**
   * @example
   * ```json
   * {
   *   "web": {
   *      "cadlVersion": {
   *        "test": "0.7d",
   *        "stable": "0.7d"
   *     }
   *   }
   * }
   * ```
   */
  web: RootConfigDeviceVersionObject
  ios: RootConfigDeviceVersionObject
  android: RootConfigDeviceVersionObject
  keywords: string[]
  /**
   * @example
   * ```json
   * { "viewWidthHeightRatio": { "min": "7", "max": "8" } }
   * ```
   */
  viewWidthHeightRatio?: {
    min: number
    max: number
  }
} & { [key: string]: any }

export interface AppConfig {
  /**
   * @example
   * ```js
   * const assetsUrl = `${baseUrl}assets
   * ```
   */
  assetsUrl: string
  /** The equivalent of "cadlBaseUrl" from the root config */
  baseUrl: string
  /**
   * @example
   * ```json
   * {
   *   "languageSuffix": {
   *      "en": "en-US",
   *      "es": "en-ES"
   *   }
   * }
   * ```
   */
  languageSuffix: { [lang: string]: string }
  /**
   * @example
   * ```js
   * const fileSuffix = '.yml'
   * ```
   */
  fileSuffix: LiteralUnion<'.yml', string>
  /**
   * The default page for user sessions where they haven't visited any pages
   * Also the default page for unauthorized users
   * @example
   * ```json
   * { "startPage": "SignIn.yml" }
   * ```
   */
  startPage: string
  /**
   * Pages to be loaded before loading other pages
   * @example
   * ```js
   * const preload = ['BaseCSS', 'BaseDataModel', 'BasePage']
   * ```
   */
  preload: string[]
  /**
   * Pages to be loaded and treated as routes in the runtime
   * @example
   * ```js
   * const page = ['PatientDashboard', 'SignIn', 'SignUp', 'CreateNewAccount']
   * ```
   */
  page: string[]
  [key: string]: any
}

export interface RootConfigDeviceVersionObject {
  cadlVersion: {
    stable: number
    test: number
  }
}

/**
 * Objects that become builtIn functions during runtime.
 *
 * Built in eval objects are implemented in the application, making
 * it an app level implementation
 *
 * @example
 * ```json
 * {
 *   "=.builtIn.string.concat": [
 *      "+1",
 *      " ",
 *      "8882468442"
 *   ]
 * }
 * ```
 * becomes:
 * ```js
 * const myBuiltIn = function(...strings) {
 *   return strings.reduce((acc, str) => acc.concat(str))
 * }
 * ```
 */
export type BuiltInEvalObject<S extends string = string> = Record<
  ReferenceString<`builtIn${S}`, '=.'>,
  Partial<Record<'dataIn' | 'dataOut', OrArray<DataIn | DataOut>>> | string
>

/**
 * Strings that represent data that may mutate a value depending on if it is referencing a path.
 * If the eval reference is an object then it is transformed into a function instead.
 *  - This function mutates the value at the referenced path (if any).
 */
export type BuiltInEvalReference<S extends string> = ReferenceString<
  `builtIn${S}`,
  '=.'
>

export type DataIn = OrArray<
  EmitObjectFold | IfObject | PolymorphicObject | string
>

export type DataOut = OrArray<
  EmitObjectFold | IfObject | PolymorphicObject | string
>

export type DeviceType = 'android' | 'ios' | 'web'

export type Env = 'stable' | 'test'

export type EcosDocument<
  NF extends NameField = NameField,
  MT extends MediaType = MediaType,
> = {
  id?: string | null
  ctime?: number | null
  mtime?: number | null
  atime?: number | null
  atimes?: number | null
  tage?: number | null
  type?: number | null
  name?: NF | null
  deat?: Deat | null
  size?: number | null
  fid?: string | null
  eid?: string | null
  bsig?: string | null
  esig?: string | null
  created_at?: number | null
  modified_at?: number | null
  subtype?: SubtypeObject<MT> | null
}

export interface NameField<Type extends MimeType.Options = MimeType.Options> {
  tags?: string[]
  title?: string
  data?: string
  type: Type
  user?: string
  [key: string]: any
}

export namespace MimeType {
  export type Options = Audio | Image | Json | Pdf | Text | Video
  // prettier-ignore
  export type Audio = `audio/${'3gp' | 'flac' | 'm4a' | 'mp3' | 'ogg' | 'wav' | 'webm' | 'wma'}`
  // prettier-ignore
  export type Image = `image/${'ai' | 'bmp' | 'eps' | 'gif' | 'jpeg' | 'jpg' | 'png' | 'psd' | 'svg' | 'tiff' | 'webp'}`
  export type Json = 'application/json'
  export type Pdf = 'application/pdf'
  export type Text = `text/${'css' | 'html' | 'javascript' | 'plain'}`
  // prettier-ignore
  export type Video = `video/${'avi' | 'flv' | 'mkv' | 'mov' | 'mp4' | 'mpg' | 'ogg' | 'webm' | 'wmv'}`
}

export interface SubtypeObject<MT extends MediaType = MediaType> {
  isOnServer?: boolean | null
  isZipped?: boolean | null
  isBinary?: boolean | null
  isEncrypted?: boolean | null
  isEditable?: boolean | null
  applicationDataType?: number | null
  mediaType?: MT | null
  size?: number | null
  [key: string]: any
}

export type Deat = DeatObject | number

export interface DeatObject {
  url?: string
  sig?: string
  exptime?: string
  [key: string]: any
}

export type MediaType =
  | AudioMediaType
  | DocMediaType
  | FontMediaType
  | ImageMediaType
  | MessageMediaType
  | ModelMediaType
  | MultipartMediaType
  | OtherMediaType
  | TextMediaType
  | VideoMediaType

export type OtherMediaType = 0
export type DocMediaType = 1
export type AudioMediaType = 2
export type FontMediaType = 3
export type ImageMediaType = 4
export type MessageMediaType = 5
export type ModelMediaType = 6
export type MultipartMediaType = 7
export type TextMediaType = 8
export type VideoMediaType = 9

export type ReferenceSymbol = '.' | '..' | '=' | '~/' | '@'

/**
 * Strings that behave like placeholders which in addition mutates the value at referenced path when updates occur.
 * They are prefixed with "=" followed by a reference symbol such as ".", "..", "~", etc.
 *
 * @example
 * ```js
 * const pageObject = { SignIn: { formData: { email: 'pfft@gmail.com' } } }
 * const refString = '.SignIn.formData.email' // Value should result to "pfft@gmail.com" when parsed
 * ```
 */
export type ReferenceString<
  K extends string = string,
  S extends ReferenceSymbol | '=..' | '=.' = ReferenceSymbol | '=..' | '=.',
> = S extends '.'
  ? `.${K}`
  : S extends '..'
  ? `..${K}`
  : S extends '=.'
  ? `=${Extract<ReferenceSymbol, '.'> | never}${K}`
  : S extends '=..'
  ? `=${Extract<ReferenceSymbol, '..'> | never}${K}`
  : S extends '='
  ? `=${Extract<ReferenceSymbol, '..' | '.'> | never}${K}`
  : S extends '~/'
  ? `~/${K}`
  : S extends '@'
  ? `${K}@`
  :
      | `=..${K}`
      | `=.${K}`
      | `${Exclude<ReferenceSymbol, '@'>}${K}`
      | `${K}${Extract<ReferenceSymbol, '@'>}`

export type ReferenceObject<K extends string = string, V = any> = Record<
  K extends ReferenceString ? ReferenceString : K,
  OrArray<V>
>
/**
 * Polymorphic objects are object literals where keys are either plain strings
 * or string references, and their value is also either a plain string or
 * reference string, or another arbitrary object, or an array of arbitrary
 * objects/strings/reference strings/arrays etc.
 */
export type PolymorphicObject = ReferenceObject<
  string,
  OrArray<ReferenceObject<ReferenceString, ReferenceObject>>
>

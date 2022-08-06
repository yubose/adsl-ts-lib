export const baseRemoteConfigUrl = 'https://public.aitmed.com/config'
export const defaultConfigHostname = 'public.aitmed.com'

export const configKeySet = 'CONFIG_KEY'
export const rootConfigIsBeingRetrieved = 'RETRIEVING_ROOT_CONFIG'
export const rootConfigRetrieved = 'ROOT_CONFIG_RETRIEVED'
export const rootConfigNotFound = 'ROOT_CONFIG_NOT_FOUND'
export const rootBaseUrlPurged = 'RETRIEVED_ROOT_BASE_URL'
export const configVersionReceived = 'RETRIEVED_CONFIG_VERSION'
export const configVersionSet = 'CONFIG_VERSION'
export const placeholderPurged = 'PLACEHOLDER_PURGED'
export const appBaseUrlPurged = 'PURGED_APP_BASE_URL'
export const appEndpointPurged = 'PURGED_APP_ENDPOINT'
export const appConfigIsBeingRetrieved = 'RETRIEVING_APP_CONFIG'
export const appConfigNotFound = 'APP_CONFIG_NOT_FOUND'
export const appConfigRetrieved = 'RETRIEVED_APP_CONFIG'
export const appConfigParsed = 'PARSED_APP_CONFIG'
export const appPageNotFound = 'APP_PAGE_DOES_NOT_EXIST'
export const appPageRetrieved = 'RETRIEVED_APP_PAGE'
export const appPageRetrieveFailed = 'RETRIEVE_APP_PAGE_FAILED'

export const idKey = `noodl-loader:id`

export const _id = {
  extractor: Symbol.for(`noodl-loader:extractor`),
  strategy: Symbol.for(`noodl-loader:strategy`),
  urlStrategy: Symbol.for(`noodl-loader:url-strategy`),
} as const

export enum ExtractType {
  Unknown = 'Unknown',
  Asset = 'Asset',
  CadlEndpoint = 'CadlEndpoint',
  Config = 'Config',
  Page = 'Page',
}

export enum AssetType {
  Unknown = 'Unknown',
  Document = 'Document',
  Image = 'Image',
  Preload = 'Preload',
  Page = 'Page',
  Script = 'Script',
  Text = 'Text',
  Video = 'Video',
}

export enum StrategyKind {
  Url = 'Url',
}

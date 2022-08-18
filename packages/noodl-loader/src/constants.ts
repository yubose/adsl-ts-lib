export const baseRemoteConfigUrl = 'https://public.aitmed.com/config'
export const idKey = `noodl-loader:id`

export const _id = {
  extractor: Symbol.for(`noodl-loader:extractor`),
  fileSystemHost: Symbol.for(`noodl-loader:file-system-host`),
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

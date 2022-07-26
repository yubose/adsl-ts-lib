import type { Asset } from '../constants'

export interface ExtractedItem {
  type: Asset | 'include'
  [key: string]: any
}

export interface ExtractedAudioObject extends ExtractedItem {
  type: Asset.Audio
  path?: string
}

export interface ExtractedImageObject extends ExtractedItem {
  type: Asset.Image
  path?: string
}

export interface ExtractedJsonObject extends ExtractedItem {
  type: Asset.Json
}

export interface ExtractedPdfObject extends ExtractedItem {
  type: Asset.Pdf
}

export interface ExtractedScriptObject extends ExtractedItem {
  type: Asset.Script
  path?: string
}

export interface ExtractedYmlObject extends ExtractedItem {
  type: Asset.Yaml
  name?: string
}

export interface ExtractedVideoObject extends ExtractedItem {
  type: Asset.Video
  path?: string
}

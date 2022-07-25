import type { LiteralUnion } from 'type-fest'
import type { RootConfig as IRootConfig } from 'noodl-types'

class RootConfig implements IRootConfig {
  android = { cadlVersion: { stable: 0, test: 0 } }
  apiHost: LiteralUnion<'apiHost', string> = 'apiHost'
  apiPort: number | string = ''
  appApiHost = ''
  headPlugin?: string
  bodyTailPplugin?: string
  bodyTopPplugin?: string
  cadlBaseUrl = ''
  cadlMain: LiteralUnion<'cadlEndpoint.yml', string> = 'cadlEndpoint.yml'
  connectiontimeout: string = '5'
  debug = ''
  ios = { cadlVersion: { stable: 0, test: 0 } }
  keywords: string[] = []
  loadingLevel = 1
  myBaseUrl = ''
  timestamp = ''
  viewWidthHeightRatio?: { min: number; max: number }
  web = { cadlVersion: { stable: 0, test: 0 } }
  webApiHost: LiteralUnion<'apiHost', string> = 'apiHost'
}

export default RootConfig

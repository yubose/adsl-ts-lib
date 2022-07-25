import { stringify } from './utils/yml'

class NoodlConfig {
  #otherOptions = {
    connectiontimeout: '5',
    loadingLevel: 1,
    debug: 'console_log_api',
  }

  apiHost = ''
  apiPort = ''
  webApiHost: 'apiHost'
  appApiHost: 'apiHost'
  appKey = ''
  baseUrl = ''
  configKey = ''
  platform: ''

  viewWidthHeightRatio = {
    min: null,
    max: null,
  }

  version = null as string | null

  build() {
    return stringify(this.toJSON())
  }

  getTimestamp() {
    let date = new Date()
    let dateStr = ''

    dateStr += date.getMonth()
    dateStr += date.getDay()
    dateStr += date.getFullYear()
    dateStr += '.'
    // TODO - Implement this correctly
    dateStr += 'PDT'

    return dateStr
  }

  toJSON() {
    const otherOptions = {} as Record<string, any>

    for (const [key, value] of Object.entries(this.#otherOptions)) {
      otherOptions[key] = value
    }

    return {
      apiHost: this.apiHost,
      apiPort: this.apiPort,
      webApiHost: this.webApiHost,
      appApiHost: this.appApiHost,
      cadlMain: this.appKey,
      cadlBaseUrl: this.baseUrl,
      timestamp: this.getTimestamp(),
      viewWidthHeightRatio: this.viewWidthHeightRatio,
      ...otherOptions,
    }
  }
}

export default NoodlConfig

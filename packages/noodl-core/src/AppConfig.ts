import type { AppConfig as IAppConfig } from 'noodl-types'

class AppConfig implements IAppConfig {
  assetsUrl = ''
  baseUrl = ''
  fileSuffix = '.yml'
  languageSuffix: { [lang: string]: string } = { unknown: '_en' }
  page: string[] = []
  preload: string[] = []
  startPage = ''
}

export default AppConfig

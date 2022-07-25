import PathBrowserify from './browser/Path'

const path = new PathBrowserify()

export function ensureExt(value: unknown, ext: string) {
  if (typeof value === 'string' && ext) {
    if (!ext.startsWith('.')) ext = `.${ext}`
    return value.endsWith(ext) ? value : `${value}${ext}`
  }
  return value
}

export default path

import path from './path'
import * as t from './types'
import * as is from './utils/is'

export interface ILinkStructure
  extends t.IStructure<
    | 'config'
    | 'document'
    | 'image'
    | 'page'
    | 'script'
    | 'text'
    | 'unknown'
    | 'video'
  > {
  ext: string | null
  isRemote: boolean | null
  url: string | null
}

class LinkStructure extends t.AStructure<ILinkStructure> {
  #transform?: (p: string) => string
  configKey = ''
  name = 'link'

  constructor(transform?: (p: string) => string) {
    super()
    if (transform) this.#transform = transform
  }

  is(p: string) {
    if (this.#transform) p = this.#transform(p)
    if (typeof p === 'string') return is.url(p)
    return false
  }

  createStructure(p: any, group?: string) {
    let raw = p
    if (this.#transform) p = this.#transform(p)
    let url = typeof p === 'string' ? p : String(p)
    let parsed = path.parse(url || '')
    let basename = parsed.base

    try {
      url = new URL(url).href
    } catch (error) {
      url = null as any
    }

    let ext = parsed.ext
      ? parsed.ext.replace(/\./g, '')
      : is.file(basename)
      ? basename.substring(basename.lastIndexOf('.') + 1)
      : null

    if (ext) {
      if (['com', 'net', 'org'].includes(ext)) ext = null
      group = group || this.getGroup(parsed)
    } else {
      group = 'unknown'
    }

    return {
      ext,
      group: group as ILinkStructure['group'],
      raw,
      isRemote: String(p).startsWith('http') || String(p).startsWith('www'),
      url,
    }
  }

  getGroup(str: ReturnType<t.APath['parse']> | string) {
    const parsed = typeof str === 'object' ? str : path.parse(str)
    if (is.image(parsed.base)) return 'image'
    if (is.script(parsed.base)) return 'script'
    if (is.text(parsed.base)) return 'text'
    if (is.video(parsed.base)) return 'video'
    if (parsed.ext === '') return 'script'
    if (parsed.base.endsWith('.yml')) return 'page'
    return 'unknown'
  }
}

export default LinkStructure

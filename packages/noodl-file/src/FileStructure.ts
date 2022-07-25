import path from './path'
import * as is from './utils/is'
import * as t from './types'

export interface IFileStructure
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
  ext: string
  dir: string | null
  filepath: string | null
  rootDir: string | null
}

class FileStructure extends t.AStructure<IFileStructure> {
  #transform?: (p: string) => string
  configKey = ''
  name = 'file'

  constructor(transform?: (node: any) => any) {
    super()
    if (transform) this.#transform = transform
  }

  createStructure(p: string, group?: string) {
    const raw = p
    if (this.#transform) p = this.#transform(p)
    const str = typeof p === 'string' ? p : String(p)
    const parsed = path.parse(str)
    const basename = parsed.base
    const ext = parsed.ext
      ? parsed.ext.replace(/\./g, '')
      : is.file(basename)
      ? basename.substring(basename.lastIndexOf('.') + 1)
      : null

    return {
      name: parsed.name,
      ext: ext as string,
      group:
        (group as IFileStructure['group']) ||
        this.getGroup({ ...parsed, ext: ext as string }),
      raw,
      dir: parsed.dir || null,
      filepath: parsed.dir ? path.join(parsed.dir, basename) : null,
      rootDir: parsed.root || null,
    }
  }

  getGroup(
    filepathOrObj: ReturnType<t.APath['parse']> | string,
  ): IFileStructure['group'] {
    const parsed =
      typeof filepathOrObj === 'object'
        ? filepathOrObj
        : path.parse(filepathOrObj)
    if (parsed.ext === '') {
      return parsed.base === parsed.name ? 'unknown' : 'script'
    }
    if (parsed.base.endsWith('.yml')) return 'page'
    if (is.image(parsed.base)) return 'image'
    if (is.script(parsed.base)) return 'script'
    if (is.text(parsed.base)) return 'text'
    if (is.video(parsed.base)) return 'video'
    return 'unknown'
  }

  is(p: string) {
    if (this.#transform) p = this.#transform(p)
    if (p.startsWith('file:')) return true
    if (is.file(p)) return true
    return false
  }
}

export default FileStructure

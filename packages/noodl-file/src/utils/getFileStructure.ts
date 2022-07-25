import path from '../path'

/**
 * @param { string } filepath
 * @param { object } opts
 * @param { string } [opts.config]
 * @returns { FileStructure }
 */
function getFileStructure(filepath: string, opts?: { config?: string }) {
  const parsed = path.parse(filepath)
  const structure = {
    dir: parsed.dir,
    ext: parsed.ext,
    filename: parsed.name,
    filepath,
    rootDir: parsed.root,
  } as any

  if (structure.ext === '.yml') {
    if (
      opts?.config &&
      (opts?.config === parsed.name || opts?.config === parsed.base)
    ) {
      structure.group = 'config'
    } else {
      structure.group = 'page'
    }
  } else if (/.(gif|jpg|jpeg|png|bmp|tif|tiff)$/.test(parsed.base)) {
    structure.group = 'image'
  } else if (structure.ext === '') {
    structure.group = 'script'
  } else if (/[./]*(doc|docx|json|pdf)$/i.test(parsed.base)) {
    structure.group = 'document'
  } else if (/.(avi|mkv|mp4|wmv|ogg|mpg|mpeg|flav)$/.test(parsed.base)) {
    structure.group = 'video'
  } else {
    structure.group = 'unknown'
  }

  return structure
}

export default getFileStructure

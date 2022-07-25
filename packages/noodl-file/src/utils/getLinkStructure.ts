import path from '../path'
import { ILinkStructure } from '../LinkStructure'

/**
 * @param { string } link
 * @param { object } opts
 * @returns { ILinkStructure }
 */
function getLinkStructure(
  link: string,
  opts?: { config?: string; prefix?: string },
) {
  const parsed = path.parse(link)
  const structure = {
    name: '',
    raw: link,
    ext: parsed.ext,
    filename: parsed.name,
    group: 'unknown',
    isRemote: /^(http|www)/i.test(link),
    url: link.startsWith('http')
      ? link
      : opts?.prefix
      ? `${opts.prefix}${opts.prefix.endsWith('/') ? link : `/${link}`}`
      : link,
  } as ILinkStructure

  if (opts?.config === structure['configKey']) {
    structure.group = 'config'
  } else if (structure.ext) {
    if (structure.ext?.endsWith('.yml')) {
      structure.group = 'page'
    } else if (/.*(bmp|gif|jpg|jpeg|png|tif)$/i.test(structure.ext)) {
      structure.group = 'image'
    } else if (/.*(doc|docx|json|pdf)$/i.test(structure.ext)) {
      structure.group = 'document'
    } else if (/.*(avi|mp4|mkv|wmv)$/i.test(structure.ext)) {
      structure.group = 'video'
    } else if (/.*(html)$/i.test(structure.ext)) {
      structure.group = 'script'
    } else {
      structure.group = 'unknown'
    }
  }

  return structure
}

export default getLinkStructure

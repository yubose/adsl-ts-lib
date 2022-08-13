import * as u from '@jsmanifest/utils'

export function trimPageName(value: string | null | undefined) {
  if (!u.isStr(value)) return ''
  return value.replace(/\.yml|_en/g, '').trim()
}

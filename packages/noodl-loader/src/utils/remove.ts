import * as u from '@jsmanifest/utils'

export function removeExt(value: string) {
  if (!u.isStr(value)) return value
  if (value.includes('.')) {
    return value.substring(0, value.lastIndexOf('.'))
  }
  return value
}

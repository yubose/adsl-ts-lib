import { is as coreIs } from 'noodl-core'

export function removeExt(value: string) {
  if (!coreIs.str(value)) return value
  if (value.includes('.')) {
    return value.substring(0, value.lastIndexOf('.'))
  }
  return value
}

import { is as coreIs } from 'noodl-core'

export function trimPageName(value: string | null | undefined) {
  if (!coreIs.str(value)) return ''
  return value.replace(/\.yml|_en/g, '').trim()
}

import path from 'path'

export function isPageInArray(preload: string[], name: string) {
  if (!preload.length) return false
  if (name.includes('_en')) name = name.replace('_en', '')
  if (name.endsWith('.yml')) name = name.substring(0, '.yml'.length)
  name = name.trim()
  return preload.some((str) => str.startsWith(name) || str.endsWith(name))
}

export function resolvePath(...p: string[]) {
  return path.resolve(process.cwd(), ...p)
}

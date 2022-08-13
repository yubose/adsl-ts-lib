export default function shallowMerge<O = any>(obj: O, value: any) {
  if (value !== null && typeof value === 'object') {
    for (const [key, val] of Object.entries(value)) obj[key] = val
  }
  return obj
}

export type Type =
  | 'array'
  | 'boolean'
  | 'function'
  | 'null'
  | 'number'
  | 'object'
  | 'string'

export default function typeOf(value: any): Type | undefined {
  const type = typeof value
  switch (type) {
    case 'boolean':
    case 'function':
    case 'number':
    case 'string':
      return type
    case 'object':
      if (Array.isArray(value)) return 'array'
      if (value === null) return 'null'
      return type
    default:
      return undefined
  }
}

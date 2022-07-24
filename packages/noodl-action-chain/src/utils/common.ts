export function createId() {
  return `_${Math.random().toString(36).substr(2, 9)}`
}

export function isArray(v: any): v is any[] {
  return Array.isArray(v)
}

export function isFunction(v: any): v is (...args: any[]) => any {
  return typeof v === 'function'
}

export function isPlainObject<O extends {}>(v: any): v is O {
  return !!(v && !Array.isArray(v) && typeof v === 'object')
}

export function isString(v: any): v is string {
  return typeof v === 'string'
}

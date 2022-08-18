import type { LiteralUnion } from 'type-fest'

class KeyValueCache<Keys = string> {
  #data = new Map<Keys, any>()

  clear() {
    this.#data.clear()
    return this
  }

  has(key: string) {
    return this.#data.has(key as any)
  }

  get(key?: LiteralUnion<Keys, string>): any
  get(): Record<string, any>
  get(key?: LiteralUnion<Keys, string>) {
    if (key) return this.#data.get(key as Keys)
    return [...this.#data.entries()].reduce((acc, [k, v]) => {
      acc[k as any] = v
      return acc
    }, {})
  }

  set(key: LiteralUnion<Keys, string>, value: any) {
    this.#data.set(key as Keys, value)
    return this
  }

  merge(obj: Record<string, any>) {
    for (const [key, value] of Object.entries(obj)) this.set(key as any, value)
    return this
  }

  remove(key: LiteralUnion<Keys, string>) {
    this.#data.delete(key as Keys)
    return this
  }
}

export default KeyValueCache

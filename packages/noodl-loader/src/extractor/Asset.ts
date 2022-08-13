import type { LiteralUnion } from 'type-fest'
import type { ExtractAssetPreset } from './extractor-types'

class Asset<O extends Record<string, any> = Record<string, any>> {
  #id = ''
  #props = {} as O
  type = '' as LiteralUnion<'' | ExtractAssetPreset, string>;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor(type?: Asset['type']) {
    if (type) this.type = type
  }

  get props() {
    return this.#props
  }

  clear() {
    for (const key of Object.keys(this.props)) {
      delete this.props[key]
    }
    return this
  }

  get(key: LiteralUnion<keyof O, string>) {
    return this.#props[key]
  }

  set(key: LiteralUnion<keyof O, string>, value: any) {
    this.#props[key] = value
    return this
  }

  getId() {
    return this.#id
  }

  setId(id: any) {
    this.#id = id
    return this
  }

  merge(...objs: Record<string, any>[]) {
    for (const obj of objs) {
      for (const [key, value] of Object.entries(obj)) {
        this.set(key, value)
      }
    }
    return this.props
  }

  remove(key: LiteralUnion<keyof O, string>) {
    delete this.props[key]
    return this
  }

  toJSON() {
    return {
      type: this.type,
      id: this.getId(),
      props: this.#props,
    }
  }

  toString() {
    return JSON.stringify(this.toJSON(), null, 2)
  }
}

export default Asset

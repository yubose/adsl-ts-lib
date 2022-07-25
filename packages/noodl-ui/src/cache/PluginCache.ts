import type { ICache, Plugin } from '../types'

const _locations = ['head', 'body-top', 'body-bottom'] as Plugin.Location[]

class PluginCache implements ICache {
  static _inst: PluginCache

  #head: Map<string, Plugin.Object> = new Map()
  #bodyTop: Map<string, Plugin.Object> = new Map()
  #bodyTail: Map<string, Plugin.Object> = new Map();

  [Symbol.iterator]() {
    const plugins = [
      ...this.#head.values(),
      ...this.#bodyTop.values(),
      ...this.#bodyTail.values(),
    ].reverse()

    return {
      next: () => {
        return {
          value: plugins.pop(),
          done: !plugins.length,
        }
      },
    }
  }

  get length() {
    return this.#head.size + this.#bodyTop.size + this.#bodyTail.size
  }

  add(location: Plugin.Location, obj: Plugin.Object) {
    if (!_locations.includes(location)) {
      throw new Error(
        `Invalid plugin location "${location}". Available options are: ${_locations.join(
          ', ',
        )}`,
      )
    }

    const id = obj.id || ''
    if (location === 'head') this.#head.set(id, obj)
    else if (location === 'body-top') this.#bodyTop.set(id, obj)
    else if (location === 'body-bottom') this.#bodyTail.set(id, obj)
    return obj
  }

  clear() {
    this.#head.clear()
    this.#bodyTop.clear()
    this.#bodyTail.clear()
    return this
  }

  get(location?: Plugin.Location): Map<string, Plugin.Object>
  get(): Plugin.Object[]
  get(location?: Plugin.Location) {
    switch (location) {
      case 'head':
        return this.#head
      case 'body-top':
        return this.#bodyTop
      case 'body-bottom':
        return this.#bodyTail
      default:
        return [
          ...this.#head.values(),
          ...this.#bodyTop.values(),
          ...this.#bodyTail.values(),
        ]
    }
  }

  has(id: string | undefined) {
    if (typeof id !== 'string') return false
    return this.#head.has(id) || this.#bodyTop.has(id) || this.#bodyTail.has(id)
  }

  remove(id: string | undefined) {
    if (typeof id !== 'string') return null
    for (const plugins of [this.#head, this.#bodyTop, this.#bodyTail]) {
      if (plugins.has(id)) {
        const deletedPlugin = plugins.get(id)
        plugins.delete(id)
        return deletedPlugin || null
      }
    }
    return null
  }
}

export default PluginCache

import type { Register } from '../types'

class RegisterCache {
  #cache: Map<string, Register.Object> = new Map()

  static _inst: RegisterCache

  constructor() {
    if (RegisterCache._inst) return RegisterCache._inst
    RegisterCache._inst = this
  }

  clear() {
    this.#cache.clear()
    return this
  }

  has<N extends string = string>(name: N | undefined) {
    if (!name) return false
    return this.#cache.has(name)
  }

  get<N extends string = string>(name: N): Register.Object
  get(): Map<string, Register.Object>
  get<N extends string = string>(name?: N) {
    if (!name) return this.#cache
    return this.#cache.get(name)
  }

  set<N extends string = string>(name: N, obj: Partial<Register.Object>) {
    this.#cache.set(name, obj as Register.Object)
    return obj as Register.Object
  }

  remove<N extends string = any>(name: N): this {
    this.#cache.delete(name)
    return this
  }
}

export default RegisterCache

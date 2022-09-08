export class Key {
  #path = [] as (string | number)[]
  rootKey = ''

  clear() {
    this.#path.length = 0
    return this
  }

  prepend(part: string | number) {
    this.#path.unshift(part)
    return this
  }

  append(part: string | number) {
    this.#path.push(part)
    return this
  }

  pop() {
    return this.#path.pop()
  }

  setRootKey(rootKey: string) {
    this.rootKey = rootKey
    return this
  }

  resolve(root: Record<string, any>, rootKey?: string) {
    let currRootKey = this.rootKey
    let isSameRootKey = true

    if (rootKey != null) {
      isSameRootKey = currRootKey === rootKey
    }

    if (!isSameRootKey) {
      // this.rootKey
    }
  }

  toString() {
    return this.#path.join('.')
  }
}

// import path from 'path'
// import { fileURLToPath } from 'url'
// import { isUrl } from './url'

class NFile {
  #data = {}
  #name = ''
  #path = ''
  #value: any
  history = [] as string[]

  get data() {
    return this.#data
  }

  set data(data) {
    this.#data = data
  }

  get name() {
    return this.#name
  }

  set name(name) {
    this.#name = name
  }

  get path() {
    return this.#path
  }

  set path(path) {
    this.#path = path
    this.history.push(path)
  }

  get value() {
    return this.#value
  }

  set value(value) {
    this.#value = value
  }
}

export default NFile

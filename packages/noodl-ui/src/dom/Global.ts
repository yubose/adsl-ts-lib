import Timers from './global/Timers'
import type NDOMPage from './Page'
import type { ComponentPage } from './factory/componentFactory'
import * as t from '../types'

let _global: NDOMGlobal

export class NDOMGlobal {
  #components: t.GlobalMap['components'] = new Map()
  #register = new Map()
  // @ts-expect-error
  #draw: t.GlobalMap['draw'] = new Map()
  #hooks: t.GlobalMap['hooks'] = new Map()
  #pages = {} as t.GlobalMap['pages']
  #timers: t.GlobalMap['timers'] = new Timers();

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      components: this.components,
      pages: this.pages,
      timers: this.timers,
      register: this.register
    }
  }

  constructor() {
    if (!(_global instanceof NDOMGlobal)) _global = this
    return _global
  }

  get components() {
    return this.#components
  }

  get register(){
    return this.#register
  }

  get hooks() {
    return this.#hooks
  }

  get pages() {
    return this.#pages
  }

  get pageIds() {
    return Object.keys(this.#pages)
  }

  get pageNames() {
    return Object.values(this.#pages).reduce(
      (acc, page) =>
        typeof page.page === 'string' ? acc.concat(page.page) : acc,
      [] as string[],
    )
  }


  get timers() {
    return this.#timers
  }


  add(page: NDOMPage | ComponentPage) {
    // @ts-expect-error
    this.pages[page.id] = page
  }
}

export default NDOMGlobal

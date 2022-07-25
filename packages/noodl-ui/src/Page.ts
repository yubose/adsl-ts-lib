import type { ComponentObject } from 'noodl-types'
import { getRandomKey } from './utils/internal'
import type { IPage } from './types'
import Viewport from './Viewport'
import * as c from './constants'
import * as t from './types'

type OnChangeFn = (prevPage: string, newPage: string) => void
type NuiPageHooks = {
  PAGE_CHANGED: ((...args: any[]) => any)[]
}

class Page implements IPage {
  static _id: IPage['id'] = 'root'
  #get: () => ComponentObject[] = () => []
  #hooks = { PAGE_CHANGED: [] } as NuiPageHooks
  #onChange = new Map<string, OnChangeFn>()
  #id: IPage['id']
  #page = ''
  created: number
  history = [] as string[]
  viewport: Viewport;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor(
    viewport: Viewport = new Viewport(),
    { id = getRandomKey(), name }: { id?: IPage['id']; name?: string } = {},
  ) {
    this.#id = id
    this.created = Date.now()
    name && (this.#page = name)
    this.viewport = viewport
  }

  /**
   * Recommended to be used to differentiate between Page instances
   */
  get key() {
    return `${this.id}-${this.created}`
  }

  get id() {
    return this.#id
  }

  get components() {
    return this.#get() || []
  }

  get onChange() {
    return this.#onChange
  }

  get page() {
    return this.#page
  }

  set page(name: string) {
    if (this.#page === name) return
    const prev = this.#page
    this.#page = name
    this.history.push(name)
    if (this.history.length > 10) {
      while (this.history.length > 10) this.history.shift()
    }
    for (const fn of this.#onChange.values()) fn(prev, name)
  }

  #wrapOnChange = (fn: OnChangeFn): OnChangeFn => {
    return (prevPage, newPage) => {
      Promise.all(
        this.#hooks.PAGE_CHANGED?.map?.((fn) => fn?.(prevPage, newPage)),
      )
      return fn?.(prevPage, newPage)
    }
  }

  emit<Evt extends typeof c.nuiEvent.component.page.PAGE_CHANGED>(
    evt: Evt,
    ...args: Parameters<t.NuiComponent.Hook[Evt]>
  ) {
    this.#hooks[evt]?.forEach?.((fn) => fn?.(...args))
  }

  on<Evt extends typeof c.nuiEvent.component.page.PAGE_CHANGED>(
    evt: Evt,
    fn: t.NuiComponent.Hook[Evt],
  ) {
    fn && this.#hooks[evt].push(fn)
    return this
  }

  toJSON() {
    return {
      created: this.created,
      components: this.components,
      currentPage: this.page,
      history: this.history,
      id: this.#id,
      viewport: {
        width: this.viewport?.width || null,
        height: this.viewport?.height || null,
      },
    }
  }

  toString() {
    return JSON.stringify(this.toJSON?.(), null, 2)
  }

  use(options: { onChange: { id: string; fn: OnChangeFn } }): void
  use(getComponents: () => Page['components']): void
  use(
    getComponents:
      | (() => Page['components'])
      | { onChange: { id: string; fn: OnChangeFn } },
  ) {
    if (typeof getComponents === 'function') {
      this.#get = getComponents
    } else if (typeof getComponents === 'object') {
      if (
        'onChange' in getComponents &&
        !this.#onChange.has(getComponents.onChange.id)
      ) {
        this.#onChange.set(
          getComponents.onChange.id,
          this.#wrapOnChange(getComponents.onChange.fn),
        )
      }
    }
    return this
  }
}

export default Page

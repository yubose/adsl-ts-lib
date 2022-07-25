import * as u from '@jsmanifest/utils'
import type { OrArray } from '@jsmanifest/typefest'
import type Viewport from '../Viewport'
import type { ICache, IPage, NuiComponent } from '../types'
import NuiPage from '../Page'
import isComponent from '../utils/isComponent'
import * as c from '../constants'

export interface PageCacheHooks {
  [c.cache.page.hooks.PAGE_CREATED](args: {
    component?: NuiComponent.Instance
    page: NuiPage
  }): void
  [c.cache.page.hooks.PAGE_REMOVED](page: NuiPage): void
}

export interface State {
  created: Map<number, StatePageObject>
  removed: Map<number, StatePageObject>
}

export interface StatePageObject {
  startPage: string
  endPage: string
}

class PageCache implements ICache {
  #hooks = {
    [c.cache.page.hooks.PAGE_CREATED]: [] as PageCacheHooks['PAGE_CREATED'][],
    [c.cache.page.hooks.PAGE_REMOVED]: [] as PageCacheHooks['PAGE_REMOVED'][],
  }
  #pages = new Map() as Map<IPage['id'], { page: NuiPage }>
  #state = {
    created: new Map(),
    removed: new Map(),
  } as State

  static _inst: PageCache;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  [Symbol.iterator]() {
    const pages = [...this.#pages].reverse()
    return {
      next() {
        return {
          value: pages.pop(),
          done: !pages.length,
        }
      },
    }
  }

  constructor() {
    if (PageCache._inst) return PageCache._inst
    PageCache._inst = this

    this.on('PAGE_CREATED', ({ page }) => {
      this.state.created.set(page.created, {
        startPage: page.page,
        endPage: '',
      })
    })

    this.on('PAGE_REMOVED', (page) => {
      this.state.removed.set(page.created, {
        ...this.state.created.get(page.created),
        endPage: page.page,
      } as StatePageObject)
      this.state.created.delete(page.created)
    })
  }

  get length() {
    return this.#pages.size
  }

  get hooks() {
    return this.#hooks
  }

  get state() {
    return this.#state
  }

  clear() {
    for (const [id, { page }] of this.#pages) {
      u.isArr(page.components) && (page.components.length = 0)
      this.#pages.delete(id)
    }
    u.forEach((fns) => (fns.length = 0), u.values(this.#hooks))
    return this
  }

  // create(component: NuiComponent.Instance, page?: NuiPage): NuiPage
  create(
    args: {
      name?: string
      // If component is passed in it must be treated as a page component.
      component?: NuiComponent.Instance
      id?: string
      onChange?: { id?: string; fn?: (prev: string, next: string) => void }
      viewport?: Viewport
    } = {},
  ) {
    let { id, name, viewport } = args
    id = id || (!this.#pages.size ? 'root' : undefined)
    const page = new NuiPage(viewport, { id, name })
    args.onChange &&
      page.use({
        onChange: {
          id: args.onChange.id || '',
          fn: args.onChange.fn as (prev: string, next: string) => void,
        },
      })
    this.#pages.set(page.id, { page })
    const emitArgs = { page } as {
      component?: NuiComponent.Instance
      page: NuiPage
    }
    if (isComponent(args.component)) emitArgs.component = args.component
    this.#emit(c.cache.page.hooks.PAGE_CREATED, emitArgs)
    return this.#pages.get(page.id)?.page as NuiPage
  }

  #emit = <Evt extends keyof PageCacheHooks>(
    evt: Evt,
    page: NuiPage | { component?: NuiComponent.Instance; page: NuiPage },
  ) => {
    this.#hooks[evt]?.forEach?.((fn) => fn?.(page))
  }

  get(id: IPage['id']): { page: NuiPage }
  get(id?: never): [{ page: NuiPage }]
  get(id?: IPage['id']) {
    if (!id) return [...this.#pages.values()]
    return this.#pages.get(id)
  }

  has(id: IPage['id']) {
    return this.#pages.has(id)
  }

  forEach(
    fn: (
      page: { page: NuiPage },
      index: IPage['id'],
      collection: { page: NuiPage }[],
    ) => void,
  ) {
    u.forEach(fn, [...this.#pages.values()])
  }

  on<Evt extends keyof PageCacheHooks>(evt: Evt, fn: PageCacheHooks[Evt]) {
    this.#hooks[evt]?.push?.(fn as any)
    return this
  }

  remove(page: NuiPage) {
    if (u.isNil(page)) return this
    if (this.#pages.has(page.id)) {
      const isRemoved = this.#pages.delete(page.id)
      isRemoved && this.#emit(c.cache.page.hooks.PAGE_REMOVED, page)
    }
    return this
  }

  toJSON() {
    return u.reduce(
      [...this.#pages.values()],
      (acc, obj) => {
        if (!obj) return acc
        const page = obj.page
        const pageName = page.page || 'unknown'
        if (!acc.ids.includes(page.id)) acc.ids.push(page.id)
        if (!acc.pageNames.includes(pageName)) acc.pageNames.push(pageName)
        return acc
      },
      {
        ids: [] as OrArray<string | number>[],
        length: this.length,
        pageNames: [] as string[],
      },
    )
  }
}

export default PageCache

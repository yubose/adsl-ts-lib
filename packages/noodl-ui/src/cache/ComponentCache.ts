import * as u from '@jsmanifest/utils'
import type { LiteralUnion } from 'type-fest'
import type { ComponentCacheObject, NuiComponent } from '../types'
import type NuiPage from '../Page'
import isNuiPage from '../utils/isPage'

type ComponentCacheHookEvent = 'add' | 'clear' | 'remove'

interface ComponentCacheHook {
  add(args: {
    component: NuiComponent.Instance
    page: LiteralUnion<'unknown', string>
    pageId?: string
  }): void
  clear(components: { [id: string]: NuiComponent.Instance }): void
  remove(args: { id: string | undefined; page: string | undefined }): void
}

class ComponentCache {
  #cache = new Map<string, ComponentCacheObject>()
  #observers: Record<
    ComponentCacheHookEvent,
    ComponentCacheHook[ComponentCacheHookEvent][]
  > = { add: [], clear: [], remove: [] }

  static _inst: ComponentCache;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    const result = {
      length: this.length,
      components: {} as Record<string, { ids: string[]; total: number }>,
    }

    for (const obj of this) {
      if (obj) {
        if (!(obj.page in result.components)) {
          result.components[obj.page] = {} as typeof result.components[string]
        }

        const item = result.components[obj.page]

        !item.ids && (item.ids = [])
        !item.total && (item.total = 0)

        if (!item.ids.includes(obj.component.id)) {
          item.ids.push(obj.component.id)
          item.total++
        }
      }
    }

    return result
  }

  [Symbol.iterator]() {
    const components = [...this.#cache.values()]
    return {
      next() {
        return {
          value: components.pop(),
          done: !components.length,
        }
      },
    }
  }

  constructor() {
    if (ComponentCache._inst) return ComponentCache._inst
    ComponentCache._inst = this
  }

  get length() {
    return this.#cache.size
  }

  on(e: 'add', fn: ComponentCacheHook['add']): this
  on(e: 'clear', fn: ComponentCacheHook['clear']): this
  on(e: 'remove', fn: ComponentCacheHook['remove']): this
  on<Evt extends ComponentCacheHookEvent>(e: Evt, fn: ComponentCacheHook[Evt]) {
    const obs = this.#observers[e]
    u.isArr(obs) && !obs.includes(fn) && obs.push(fn)
    return this
  }

  emit<Evt extends ComponentCacheHookEvent>(
    evt: Evt,
    ...args: Parameters<ComponentCacheHook[Evt]>
  ) {
    return this.#observers[evt]?.map?.((fn: any) => fn(...args)) || []
  }

  add(
    component: NuiComponent.Instance,
    page: NuiPage | string | undefined,
  ): ComponentCacheObject {
    if (component) {
      const pageName = isNuiPage(page)
        ? page.page
        : u.isObj(page)
        ? page.page || ''
        : page || ''
      const value = { component, page: pageName } as {
        component: NuiComponent.Instance
        page: string
        pageId?: string
      }
      isNuiPage(page) && (value.pageId = page.id as string)
      this.#cache.set(component.id, value)
      this.emit('add', value)
    }
    return this.get(component)
  }

  clear(page?: string) {
    let removed = {} as any
    let remove = (obj: ComponentCacheObject) => {
      const id = obj?.component?.id || ''
      removed[id] = obj
      this.remove(obj.component)
    }

    for (const obj of this.#cache.values()) {
      if (page !== undefined) {
        if (page === obj.page) remove(obj)
        else if (
          obj.pageId &&
          page?.startsWith('#') &&
          obj.pageId === page.substring(1)
        ) {
          remove(obj)
        }
      } else remove(obj)
    }

    this.emit('clear', removed)
    removed = null

    return this
  }

  find(kind: 'page', pageName: string): ComponentCacheObject
  find(
    cb: (obj: ComponentCacheObject) => boolean | null | undefined,
  ): ComponentCacheObject
  find(
    cbOrKind:
      | 'page'
      | ((obj: ComponentCacheObject) => boolean | null | undefined),
    pageName = '',
  ) {
    if (u.isFnc(cbOrKind)) return [...this].find((obj) => obj && cbOrKind(obj))
    return [...this].find((obj) => obj?.page === pageName)
  }

  get(): Map<string, ComponentCacheObject>
  get(
    component: NuiComponent.Instance | string | undefined,
  ): ComponentCacheObject
  get(component?: NuiComponent.Instance | string | undefined) {
    if (u.isObj(component)) return this.#cache.get(component.id)
    if (component) return this.#cache.get(component)
    return this.#cache
  }

  has(component: NuiComponent.Instance | string | undefined) {
    if (u.isNil(component)) return false
    return this.#cache.has(!u.isObj(component) ? component : component.id || '')
  }

  remove(component: NuiComponent.Instance | string) {
    if (!u.isObj(component)) {
      if (this.#cache.has(component)) {
        const id = component
        const pageName = this.#cache.get(id)?.page
        this.#cache.delete(id)
        this.emit('remove', { id, page: pageName })
      }
    } else if (component) {
      if (this.#cache.has(component.id)) {
        const id = component.id
        const pageName = this.#cache.get(component.id)?.page
        this.#cache.delete(component.id)
        this.emit('remove', { id, page: pageName })
      }
    }
    return this
  }

  /**
   * Filter results by page name (if cb is a string) or callback (if by function)
   * @param cb Page name or callback function
   * @returns { ComponentCacheObject[] }
   */
  filter(cb: string | ((obj: ComponentCacheObject) => boolean)) {
    if (u.isStr(cb)) {
      return this.reduce(
        (acc, obj) => (obj.page === cb ? acc.concat(obj) : acc),
        [] as ComponentCacheObject[],
      )
    }
    return this.reduce(
      (acc, obj) => (cb(obj) ? acc.concat(obj) : acc),
      [] as ComponentCacheObject[],
    )
  }

  forEach(cb: (obj: ComponentCacheObject) => void) {
    for (const obj of this) obj && cb(obj)
  }

  map(cb: <V>(obj: ComponentCacheObject) => V) {
    return [...this].map((v) => v && cb(v))
  }

  reduce<A>(cb: (acc: A, obj: ComponentCacheObject) => A, initialValue: A) {
    // @ts-expect-error
    return u.reduce([...this], cb, initialValue)
  }
}

export default ComponentCache

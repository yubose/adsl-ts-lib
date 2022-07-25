import * as u from '@jsmanifest/utils'
import type { OrArray } from '@jsmanifest/typefest'
import type { ComponentObject, StyleObject } from 'noodl-types'
import { getRandomKey } from './utils/internal'
import isComponent from './utils/isComponent'
import * as t from './types'

type Hooks = Record<
  t.NuiComponent.HookEvent,
  t.NuiComponent.Hook[t.NuiComponent.HookEvent][]
>

class Component<C extends ComponentObject = ComponentObject> {
  #blueprint: ComponentObject
  #hooks = {} as Hooks
  #hookCbIds: string[] = []
  #component: ComponentObject
  #children: t.NuiComponent.Instance[] = []
  #id = ''
  #parent: t.NuiComponent.Instance | null = null
  type: C['type']

  static isComponent(component: unknown): component is t.NuiComponent.Instance {
    return isComponent(component)
  }

  [Symbol.iterator]() {
    const entries = u.entries(this.#component)
    return {
      next() {
        return {
          done: !entries.length,
          value: entries.pop() || [],
        }
      },
    }
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      ...this.toJSON(),
      type: this.type,
      blueprint: this.#blueprint,
      hooks: this.hooks,
      hookIds: this.#hookCbIds,
    }
  }

  constructor(component: C, opts?: { id?: string }) {
    this.#blueprint = Component.isComponent(component)
      ? component.blueprint
      : component
    this.#component = {
      ...this.#blueprint,
      style: { ...this.#blueprint.style },
    }
    this.#id = opts?.id || this.#component.id || getRandomKey()
    this.type = this.#blueprint.type
  }

  get blueprint() {
    if (!this.#blueprint) this.#blueprint = { type: this.type }
    return this.#blueprint
  }

  get children() {
    if (!this.#children) this.#children = []
    return this.#children
  }

  get contentType() {
    return this.blueprint?.contentType || ''
  }

  get hooks() {
    return this.#hooks
  }

  get id() {
    return this.#id
  }

  get length() {
    return this.children.length || 0
  }

  get parent() {
    return this.#parent
  }

  /**
   * Returns the value of the component property using key, or
   * Returns the value of the property of the component's style object
   * using styleKey if key === 'style'
   * @param { string } key - Component property or "style" if using styleKey for style lookups
   */
  get props() {
    return this.#component as ComponentObject & { id: string }
  }

  /** Returns the most recent styles at the time of this call */
  get style() {
    if (!this.props.style || u.isStr(this.props.style)) {
      this.props.style = {}
    }
    return this.props.style as StyleObject
  }

  set style(style: StyleObject) {
    this.#component.style = style
  }

  /**
   * Returns the value of the component property using key, or
   * Returns the value of the property of the component's style object
   * using styleKey if key === 'style'
   * @param { string } key - Component property or "style" if using styleKey for style lookups
   */
  get<K extends keyof ComponentObject>(
    key: K | K[],
    styleKey?: keyof StyleObject,
  ): ComponentObject[K] | Record<K, ComponentObject[K]> | undefined {
    if (u.isStr(key)) {
      // Returns the original type
      // TODO - Deprecate component.type since component.type is sufficient enough now
      if (key === 'type') return this.type
      const value = this.#retrieve(key, styleKey)
      return value
    }
    // component.get(['someKey', 'someOtherKey'])
    if (u.isArr(key)) {
      const value = {} as Record<K, ComponentObject[K]>
      key.forEach((k) => (value[k] = this.#retrieve(k)))
      return value
    }
  }

  /** Used by this.get */
  #retrieve = <K extends keyof ComponentObject | 'cache'>(
    key: K,
    styleKey?: keyof StyleObject,
  ) => {
    let value: any

    if (key === 'style') {
      // Retrieve the entire style object
      if (u.isUnd(styleKey)) {
        value = this.blueprint.style
      }
      // Retrieve a property of the style object
      else if (u.isStr(styleKey)) {
        value = this.blueprint.style?.[styleKey]
      }
    } else {
      // Return the original type only for this case
      if (key === 'type') {
        value = this.blueprint.type
      } else {
        value =
          this.#component[key as keyof ComponentObject] ||
          this.#blueprint[key as keyof ComponentObject]
      }
    }

    return value
  }

  /**
   * Sets a property's value on the component, or sets a property's value on
   * the style object if the key is "style", value is the styleKey and
   * styleChanges is the value to update on the style object's styleKey
   * @param { string } key - Key of component or "style" to update the style object using value
   * @param { any? } value - Value to update key, or styleKey to update the style object if key === 'style'
   * @param { any? } styleChanges - Value to set on a style object if key === 'style'
   */
  set<K extends string = any>(key: K, value?: any, styleChanges?: any): this
  set<O extends ComponentObject>(key: O, value?: any, styleChanges?: any): this
  set<K extends string = any>(key: K, value?: any, styleChanges?: any) {
    if (key === 'style') {
      this.style && (this.style[value] = styleChanges)
    } else {
      this.#component[key] = value
    }
    return this
  }

  /**
   * Returns true if the key exists on the blueprint
   * NOTE: This method is for keys that have explicitly been set via
   * this.set
   * @param { string } key - Component property or "style" if using styleKey for style lookups
   */
  has<K extends keyof ComponentObject>(key: K) {
    return key in (this.props || {})
  }

  /**
   * Removes a component property, or removes a style property from the style object
   * using styleKey if key === 'style'
   * @param { string } key - Component property, or "style" if removing a style property using styleKey
   */
  remove(key: string, styleKey?: keyof StyleObject) {
    if (key === 'style' && u.isStr(styleKey)) {
      if (this.#component.style) {
        delete this.#component.style[styleKey]
      }
    } else {
      delete this.#component[key]
    }
    return this
  }

  /**
   * Returns a stringified JSON object of the current component
   * @param { number | undefined } spaces - Spaces to indent in the JSON string
   */
  toString({ spaces = 2 }: { spaces?: number } = {}) {
    return JSON.stringify(this.toJSON(), null, spaces)
  }

  setParent(parent: t.NuiComponent.Instance | null) {
    this.#parent = parent
    return this
  }

  /**
   * Returns a child at the index. Returns null if nothing was found.
   * If an index is not passed in it will default to returning the
   * first child or null otherwise
   * @param { number } index
   */
  child(index?: number) {
    if (!u.isNum(index)) return this.children[0]
    return this.children[index]
  }

  /**
   * Creates and appends the new child instance to the childrens list
   * @param { IComponentType } props
   */
  createChild<C extends t.NuiComponent.Instance>(child: C): C {
    child?.setParent?.(this)
    this.#children.push(child)
    return child
  }

  /**
   * Removes a child from its children. You can pass in either the instance
   * directly, the index leading to the child, the component's id, or leave the args empty to
   * remove the first child by default
   * @param { t.NuiComponent.Instance | string | number | undefined } child - Child component, id, index, or no arg (to remove the first child by default)
   */
  removeChild(index: number): t.NuiComponent.Instance | undefined
  removeChild(id: string): t.NuiComponent.Instance | undefined
  removeChild(
    child: t.NuiComponent.Instance,
  ): t.NuiComponent.Instance | undefined
  removeChild(): t.NuiComponent.Instance | undefined
  removeChild(child?: t.NuiComponent.Instance | number | string) {
    if (child == undefined) {
      return this.children.shift()
    } else if (u.isNum(child)) {
      return this.children.splice(child, 1)[0]
    } else if (u.isStr(child)) {
      const index = this.children.findIndex((c) => c.id === child)
      if (index > -1) return this.children.splice(index, 1)[0]
    } else if (this.children.includes(child)) {
      return this.children.splice(this.children.indexOf(child), 1)[0]
    }
  }

  on<Evt extends t.NuiComponent.HookEvent>(
    eventName: Evt,
    cb: t.NuiComponent.Hook[Evt],
    id = '',
  ) {
    if (id) {
      // Prevents duplicates
      if (!this.#hookCbIds.includes(id)) this.#hookCbIds.push(id)
      else return this
    }
    !u.isArr(this.hooks[eventName]) && (this.hooks[eventName] = [])
    this.hooks[eventName]?.push(cb)
    return this
  }

  off<Evt extends t.NuiComponent.HookEvent>(
    eventName: Evt,
    cb: t.NuiComponent.Hook[Evt],
  ) {
    if (!u.isArr(this.hooks[eventName])) return this
    if (this.hooks[eventName]?.includes(cb)) {
      this.hooks[eventName]?.splice(
        this.#hooks[eventName]?.indexOf(cb) as number,
        1,
      )
    }
    return this
  }

  async emit<Evt extends t.NuiComponent.HookEvent>(
    eventName: Evt,
    ...args: Parameters<NonNullable<t.NuiComponent.Hook[Evt]>>
  ) {
    if (u.isArr(this.#hooks[eventName])) {
      return Promise.allSettled(
        this.#hooks[eventName].map((cb) => (cb as any)?.(...args)),
      )
    }
  }

  clear(filter?: OrArray<'children' | 'hooks'>) {
    const _clearChildren = (
      children: t.NuiComponent.Instance[] | undefined,
    ) => {
      if (u.isArr(children)) {
        children.forEach?.((child) => {
          if (child) {
            child.parent?.removeChild(child)
            child.setParent(null)
            _clearChildren(child.children)
          }
        })
        children.length = 0
      }
    }
    const _clearHooks = () =>
      u.keys(this.#hooks).forEach((evt) => {
        if (!['PAGE_COMPONENTS', 'PAGE_CHANGED', 'PAGE_CREATED'].includes(evt))
          this.#hooks[evt].length = 0
      })
    if (filter) {
      u.array(filter).forEach((s) =>
        s === 'children' ? _clearChildren(this.#children) : _clearHooks(),
      )
      return this
    }
    _clearChildren(this.children)
    _clearHooks()
    return this
  }

  /**
   * Explicitly setting style to null resets it back to an empty object
   * @param { string | function | object } props
   * @param { any | undefined } value
   */
  edit(fn: (props: ComponentObject) => ComponentObject | undefined | void): void
  edit(
    prop: Record<string, any>,
    opts?: t.NuiComponent.EditResolutionOptions,
  ): void
  edit(prop: string, value: any): void
  edit(
    fn:
      | Record<string, any>
      | string
      | ((props: ComponentObject) => ComponentObject | undefined | void),
    value?: t.NuiComponent.EditResolutionOptions,
  ) {
    if (u.isFnc(fn)) {
      const props = fn(this.props)
      if (u.isObj(props)) {
        u.entries(props).forEach(([k, v]) => {
          k === 'style' ? u.assign(this.style, v) : (this.props[k] = v)
        })
      }
    } else if (u.isStr(fn)) {
      this.props[fn] = value
    } else if (u.isObj(fn)) {
      const remove = value?.remove
        ? (prop?: 'style') => {
            const obj = prop === 'style' ? this.style : this.props
            if (u.isStr(value.remove)) {
              delete obj[value.remove]
            } else if (u.isArr(value.remove)) {
              value.remove.forEach((key) => delete obj[key])
            } else if (u.isObj(value.remove)) {
              u.entries(value.remove).forEach(
                ([k, pred]) => pred?.() && delete obj[k],
              )
            }
          }
        : undefined

      u.entries(fn).forEach(([k, v]) => {
        if (k === 'style') {
          if (v === null) this.style = {}
          else if (u.isObj(v)) u.assign(this.style, v)
          else this.style = v
          remove?.('style')
        } else {
          this.props[k] = v
          if (v === 0) {
            this.props[k] = `${v}`
          }
          remove?.()
        }
      })
    }
  }

  /** Returns the JS representation of the currently resolved component */
  toJSON() {
    return {
      ...this.props,
      id: this.id,
      parentId: this.parent?.id || null,
      children: this.children.map((child) => child?.toJSON?.()),
    }
  }
}

export default Component

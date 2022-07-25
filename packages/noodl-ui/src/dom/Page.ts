import * as u from '@jsmanifest/utils'
import { BASE_PAGE_URL, eventId } from '../constants'
import NUIPage from '../Page'
import NUIViewport from '../Viewport'
import * as t from '../types'

class Page {
  #nuiPage: NUIPage
  #state: t.Page.State = {
    aspectRatio: 1,
    aspectRatioMin: 1,
    aspectRatioMax: 1,
    previous: '',
    requesting: '',
    modifiers: {} as {
      [pageName: string]: { reload?: boolean } & Record<string, any>
    },
    status: eventId.page.status.IDLE as t.Page.Status,
    node: false,
  }
  #hooks = u
    .values(eventId.page.on)
    .reduce((acc, key) => u.assign(acc, { [key]: [] }), {}) as Record<
    t.Page.HookEvent,
    t.Page.HookDescriptor[]
  >
  // @ts-expect-error
  #node: this['id'] extends 'root' ? HTMLDivElement : HTMLIFrameElement
  pageUrl: string = BASE_PAGE_URL;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      ...this.snapshot(),
      nuiPage: this.#nuiPage,
    }
  }

  constructor(nuiPage: NUIPage) {
    this.#nuiPage = nuiPage
    this.clearNode()
    if (this.id === 'root' && !document.body.contains(this.node)) {
      document.body.appendChild(this.node)
    }
  }

  clearNode() {
    if (!this.node) {
      // @ts-expect-error
      this.node =
        document.getElementById(String(this.id)) ||
        document.createElement('div')
      this.node.id = this.id as string
    }
    this.emitSync(eventId.page.on.ON_BEFORE_CLEAR_ROOT_NODE, this.node)
    this.node.textContent = ''
    this.node.style.cssText = ''
    this.node.style.position = 'absolute'
    this.node.style.width = '100%'
    this.node.style.height = '100%'

    return this
  }

  get aspectRatio() {
    return this.#state.aspectRatio
  }

  set aspectRatio(value) {
    this.#state.aspectRatio = value
  }

  get aspectRatioMin() {
    return this.#state.aspectRatioMin
  }

  set aspectRatioMin(value) {
    const minBefore = this.aspectRatioMin
    this.#state.aspectRatioMin = value
    this.emitSync(eventId.page.on.ON_ASPECT_RATIO_MIN, minBefore, value)
  }

  get aspectRatioMax() {
    return this.#state.aspectRatioMax
  }

  set aspectRatioMax(value) {
    const maxBefore = this.aspectRatioMax
    this.#state.aspectRatioMax = value
    this.emitSync(eventId.page.on.ON_ASPECT_RATIO_MAX, maxBefore, value)
  }

  get components() {
    return this.#nuiPage?.components || null
  }

  get created() {
    return this.#nuiPage?.created || null
  }

  get history() {
    return this.getNuiPage()?.history || []
  }

  get hooks() {
    return this.#hooks
  }

  get id() {
    return (this.#nuiPage?.id as string) || null
  }

  get modifiers() {
    if (!this.#state.modifiers) this.#state.modifiers = {}
    return this.#state.modifiers
  }

  get page() {
    return (this.#nuiPage?.page as string) || ''
  }

  set page(page: string) {
    this.#nuiPage && (this.#nuiPage.page = page || '')
  }

  get previous() {
    return this.#state.previous
  }

  set previous(pageName: string) {
    this.#state.previous = pageName || ''
  }

  get requesting() {
    return this.#state.requesting
  }

  set requesting(pageName: string) {
    if (pageName === '') this.#state.modifiers = {}
    this.#state.requesting = pageName || ''
  }

  get node() {
    return this.#node
  }

  set node(node) {
    this.#node = node
    this.emitSync(eventId.page.on.ON_SET_ROOT_NODE, { node })
  }

  get tagName() {
    return this.node?.tagName?.toLowerCase?.() || ''
  }

  get viewport() {
    return this.#nuiPage?.viewport as NUIViewport
  }

  set viewport(viewport) {
    this.#nuiPage.viewport = viewport
  }

  getNuiPage() {
    return this.#nuiPage as NUIPage
  }

  getCbs() {
    return this.hooks
  }

  clearCbs() {
    u.forEach((arr) => {
      while (arr.length) arr.pop()
    }, u.values(this.hooks))
    return this
  }

  getPreviousPage(startPage: string) {
    startPage = startPage || this.previous
    let previousPage
    let parts = this.pageUrl.split('-')
    if (parts.length > 1) {
      while (parts[parts.length - 1]?.endsWith('MenuBar') && parts.length > 1) {
        parts.pop()
      }
      previousPage = parts.pop()
    } else if (parts.length === 1) {
      previousPage = parts[0].split('?')[1]
    } else {
      previousPage = startPage
    }
    return previousPage || ''
  }

  /**
   * Returns a JS representation of the current state of this page instance
   */
  snapshot<OtherProps extends Record<string, any> = Record<string, any>>(
    opts?: OtherProps,
  ) {
    const snapshot = {
      created: this.created,
      id: this.id,
      components: this.components,
      modifiers: this.modifiers,
      status: this.#state.status,
      previous: this.#state.previous,
      current: this.page,
      requesting: this.#state.requesting,
      pageUrl: this.pageUrl,
      viewport: {
        width: this.viewport?.width,
        height: this.viewport?.height,
      },
      node: {
        id: this.node.id,
        width: this.node.style.width,
        height: this.node.style.height,
        childElementCount: this.node.childElementCount,
        tagName: this.node.tagName,
      },
      tagName: this.tagName,
      ...opts,
    }
    return snapshot as typeof snapshot & OtherProps
  }

  on<K extends t.Page.HookEvent>(evt: K, fn: t.Page.Hook[K]) {
    if (this.hooks[evt] && !this.hooks[evt].some((o) => o.id === evt)) {
      this.hooks[evt].push({ id: evt, fn })
    }
    return this
  }

  off<K extends t.Page.HookEvent>(evt: K, fn: t.Page.Hook[K]) {
    const index = this.hooks[evt]?.findIndex?.((o) => o.fn === fn) || -1
    if (index !== -1) this.hooks[evt].splice(index, 1)
    return this
  }

  once<Evt extends t.Page.HookEvent>(evt: Evt, fn: t.Page.Hook[Evt]) {
    const descriptor: t.Page.HookDescriptor<Evt> = { id: evt, once: true, fn }
    this.hooks[evt].push(descriptor)
    return this
  }

  async emitAsync<K extends t.Page.HookEvent>(
    evt: K,
    ...args: Parameters<t.Page.Hook[K]>
  ) {
    let results
    if (u.isArr(this.hooks[evt])) {
      results = await Promise.all(
        u.map((o) => (o.fn as any)(...args), this.hooks[evt]),
      )
    }
    return results ? results.find(Boolean) : results
  }

  emitSync<K extends t.Page.HookEvent>(
    evt: K,
    ...args: Parameters<t.Page.Hook[K]>
  ) {
    u.forEach?.((d, index) => {
      // @ts-expect-error
      d.fn?.call?.(this, ...args)
      if (d.once) this.hooks[evt].splice(index, 1)
    }, this.hooks[evt] || [])
    return this
  }

  setStatus(status: t.Page.Status) {
    this.#state.status = status
    if (status === eventId.page.status.IDLE) this.requesting = ''
    else if (status === eventId.page.status.NAVIGATE_ERROR) this.requesting = ''
    this.emitSync(eventId.page.on.ON_STATUS_CHANGE, status)
    return this
  }

  setModifier(page: string, obj: { [key: string]: any }) {
    if (!this.#state.modifiers[page]) this.#state.modifiers[page] = {}
    u.assign(this.#state.modifiers[page], obj)
    return this
  }

  remove() {
    try {
      this.#nuiPage?.viewport && (this.#nuiPage.viewport = null as any)
      u.isArr(this.components) && (this.components.length = 0)
      u.forEach((v) => v && (v.length = 0), u.values(this.#hooks))
    } catch (error) {
      console.error(error)
    }
  }

  toJSON() {
    return this.snapshot()
  }
}

export default Page

import * as u from '@jsmanifest/utils'
import type { OrArray } from '@jsmanifest/typefest'
import NDOMPage from '../../Page'
import NUIPage from '../../../Page'
import copyAttributes from '../../../utils/copyAttributes'
import isComponent from '../../../utils/isComponent'
import isNuiPage from '../../../utils/isPage'
import * as c from '../../../constants'
import * as t from '../../../types'

export type ComponentPageEvent =
  typeof c.eventId.componentPage.on[keyof typeof c.eventId.componentPage.on]

export interface ComponentPageHooks {
  [c.eventId.componentPage.on.ON_LOAD]: OnLoad[]
  [c.eventId.componentPage.on.ON_ERROR]: OnError[]
  [c.eventId.componentPage.on.ON_MESSAGE]: OnMessage[]
}

export type OnLoad = (evt: Event, node: HTMLIFrameElement) => void
export type OnError = (error: ErrorEvent) => void
export type OnMessage = (evt: MessageEvent) => void

class ComponentPage<
  N extends HTMLIFrameElement = HTMLIFrameElement,
> extends NDOMPage {
  #component: t.NuiComponent.Instance
  #hooks = {
    [c.eventId.componentPage.on.ON_LOAD]: [],
    [c.eventId.componentPage.on.ON_ERROR]: [],
    [c.eventId.componentPage.on.ON_MESSAGE]: [],
  } as ComponentPageHooks
  #nuiPage: NUIPage | undefined
  #error: Error | null = null
  initialized = false
  origin = '';

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      ...this.snapshot(),
      error: this.error,
      initialized: this.initialized,
      component: this.component?.toJSON(),
    }
  }

  constructor(
    component: t.NuiComponent.Instance,
    options?: { onLoad?: OnLoad; onError?: OnError; node?: any },
  ) {
    // console.info(`[ComponentPage]`, { component, options })
    super(
      isNuiPage(component?.get?.('page'))
        ? component?.get?.('page')
        : component,
    )
    this.#component = component
    this.node = options?.node || super.node
    this.origin = window.origin

    if (this.node) {
      if (this.node.tagName !== 'IFRAME') {
        // TODO - Do we need this?
        const attributes = copyAttributes(this.node)
        if (this.node.parentElement) {
          this.node.parentElement.removeChild(this.node)
        } else {
          this.node?.remove?.()
        }
        this.node = document.createElement('iframe') as N
        this.node.id = component.id
        u.assign(this.node, attributes)
      }
    } else {
      this.node = document.createElement('iframe')
    }

    window?.addEventListener('message', this.#onparentmessage)
    window?.addEventListener('messageerror', this.#onparentmessageerror)
    this.node?.addEventListener('load', (evt) => {
      console.log(`[ComponentPage] DOM loaded`, {
        event: evt,
        instance: this,
        id: this.id,
      })
    })
    this.node.addEventListener('error', (evt) => {
      console.error(`[ComponentPage] Error`, evt)
    })
    this.node?.addEventListener?.('unload', (evt) => {
      try {
        this.body.innerHTML = ''
        this.body.remove()
        this.node.remove()
      } catch (error) {
        console.error(`[ComponentPage] Unload error`, error)
      }
    })

    this.configure({
      allow: '*',
      name: this.page,
      onLoad: options?.onLoad,
      onError: options?.onError,
    })
  }

  get created() {
    if (!super.created) {
      // TODO - This should never be a NuiPage but just use this for now
      if (isNuiPage(this.component)) {
        return this.component.created
      }
    }
    return super.created
  }

  get component() {
    return this.#component
  }

  get hasComponent() {
    return isComponent(this.component)
  }

  get hasNuiPage() {
    return isNuiPage(this.getNuiPage())
  }

  get window() {
    return ((this.node as HTMLIFrameElement)?.contentWindow || null) as Window
  }

  get document() {
    return this.window?.document || null
  }

  get head() {
    return this.document?.head || null
  }

  get body() {
    return this.document?.body || null
  }

  get error() {
    return this.#error || null
  }

  get parentElement() {
    return this.node?.parentElement || null
  }

  get remote() {
    return (
      String(this.page).startsWith('http') ||
      String(this.page).endsWith('.html')
    )
  }

  #onparentmessage = (evt: MessageEvent) => {
    console.log(`%c[ComponentPage] Received message`, `color:#0047ff;`, evt)
    this.#hooks
    let data
    try {
      if (u.isObj(evt.data)) data = evt.data
      else if (u.isStr(evt.data)) data = JSON.parse(evt.data)
    } catch (error) {
      console.error(error)
    }
    this.emitSync(c.eventId.componentPage.on.ON_MESSAGE, data)
  }

  #onparentmessageerror = (evt: MessageEvent) => {
    console.log(
      `%c[ComponentPage] Received message error `,
      `color:#0047ff;`,
      evt,
    )
  }

  appendChild<N extends HTMLElement>(childNode: N) {
    try {
      this.body?.appendChild?.(childNode)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  clear() {
    this.remove()
    this.node?.remove?.()
    // @ts-expect-error
    u.forEach(u.clearArr, u.values(this.#hooks))
    this.#component = null as any
  }

  configure(opts: {
    [c.ARIA_LABELLEDBY]?: string
    [c.ARIA_HIDDEN]?: string
    [c.ARIA_LABEL]?: string
    /**
     * A string or an array of strings as policies to control content
     * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy#directives
     */
    allow?: OrArray<string>
    allowPaymentRequest?: boolean
    allowFullScreen?: boolean
    contentSecurityPolicy?: {
      allowImages?: boolean
      allowVideos?: boolean
      allowScripts?: boolean | OrArray<string>
      allowedHosts?: OrArray<string>
    }
    className?: string
    name?: string
    onLoad?: OnLoad
    onError?: OnError
    httpsOnly?: boolean
    width?: string
    height?: string // Defaults to 150
    /**
     * Indicates which referrer to send when fetching the frame's resource
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-referrerpolicy
     */
    referrerPolicy?: HTMLIFrameElement['referrerPolicy']
    /**
     * Applies extra restrictions to the content in the frame.
     * Defaults to an empty string (applies all restrictions)
     * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox
     */
    sandbox?: HTMLIFrameElement['sandbox']
    style?: HTMLIFrameElement['style']
    src?: string
    srcDoc?: string
    title?: string
  }) {
    opts.className && this.node.classList.add(opts.className)
    if (this.node instanceof HTMLIFrameElement) {
      opts.name && (this.node.name = opts.name)
      opts.width && (this.node.width = opts.width)
      opts.height && (this.node.height = opts.height)
    }

    if (opts.contentSecurityPolicy) {
      const addKeyPair = (k: string, v: OrArray<string> | boolean) => {
        let value = ''
        value += `${k} ${
          u.isBool(v)
            ? '*'
            : u.array(v).reduce((acc, str) => (acc += `${str};`), '')
        }`
        return value
      }
      const cspElem = document.createElement('meta')
      cspElem.setAttribute('http-equiv', c.CONTENT_SECURITY_POLICY)
      // default-src 'self' === all content should come from the site's origin
      let value = `default-src 'self';`
      let obj = opts.contentSecurityPolicy
      obj.allowImages && (value += addKeyPair('img-src', '*'))
      obj.allowVideos && (value += addKeyPair('media-src', '*'))
      obj.allowScripts && (value += addKeyPair('script-src', obj.allowScripts))
      cspElem.setAttribute('content', value)

      if (this.node instanceof HTMLIFrameElement) {
        this.node?.contentDocument?.head.appendChild(cspElem)
      }
    }

    opts.onLoad && this.on(c.eventId.componentPage.on.ON_LOAD, opts.onLoad)
    opts.onError && this.on(c.eventId.componentPage.on.ON_ERROR, opts.onError)

    if (opts.sandbox) {
      const tokenList = new DOMTokenList()
      tokenList.add(
        'allow-modals',
        'allow-orientation-lock',
        'allow-popups',
        'allow-popups-to-escape-sandbox',
        'allow-same-origin',
        'allow-scripts',
        'allow-top-navigation',
      )
    }

    return this
  }

  emitSync<Evt extends ComponentPageEvent>(
    evt: Evt,
    ...args: Parameters<ComponentPageHooks[Evt][number]>
  ): this

  emitSync<
    Evt extends typeof c.eventId.page.on[keyof typeof c.eventId.page.on],
  >(...args: Parameters<NDOMPage['emitSync']>): this

  emitSync<Evt extends string>(
    evt: Evt,
    ...args:
      | Parameters<ComponentPageHooks[ComponentPageEvent][number]>
      | Parameters<NDOMPage['emitSync']>
  ) {
    if (evt in super.hooks) {
      super.emitSync(
        evt as typeof c.eventId.page.on[keyof typeof c.eventId.page.on],
        ...(args as Parameters<NDOMPage['emitSync']>),
      )
    } else if (evt in this.#hooks) {
      u.forEach?.(
        (fn) =>
          (fn as any)?.(
            ...(args as Parameters<
              ComponentPageHooks[ComponentPageEvent][number]
            >),
          ),
        // @ts-expect-error
        this.#hooks[evt as ComponentPageEvent],
      )
    }
    return this
  }

  getNuiPage() {
    const nuiPage = this.#component?.get?.('page') as NUIPage
    nuiPage && this.#nuiPage !== nuiPage && (this.#nuiPage = nuiPage)
    return this.#nuiPage as NUIPage
  }

  on<
    Evt extends
      | ComponentPageEvent
      | typeof c.eventId.page.on[keyof typeof c.eventId.page.on],
  >(
    evt: Evt,
    fn:
      | Parameters<NDOMPage['on']>[1]
      | ComponentPageHooks[ComponentPageEvent][number],
  ) {
    if (c.eventId.page.on[evt as keyof typeof c.eventId.page.on]) {
      super.on(
        evt as keyof typeof c.eventId.page.on,
        fn as Parameters<NDOMPage['on']>[1],
      )
    } else if (evt in this.#hooks) {
      this.#hooks[evt as ComponentPageEvent].push(fn as any)
    }
    return this
  }

  patch(value: NUIPage | t.NuiComponent.Instance) {
    if (isNuiPage(value)) {
      // Update our current page to be in sync
      if (value.page !== this.page) this.page = value.page
      this.#nuiPage = value
      if (isComponent(this.component)) {
        if (this.component?.get?.('page') !== value) {
          this.component?.edit?.('page', value)
        }
      } else if (isNuiPage(this.component)) {
        console.error(
          `Received a NuiPage in the "component" property of a ComponentPage`,
          this.component,
        )
      }
    } else if (isComponent(value)) {
      this.#component = value
      if (this.#nuiPage && !value.get('page')) {
        this.component.edit('page', value)
      } else if (!this.#nuiPage && isNuiPage(value.get('page'))) {
        this.#nuiPage = value.get('page') as NUIPage
      }
    }
  }

  replaceNode<NN extends N>(node: NN) {
    try {
      if (this.parentElement) {
        this.parentElement.replaceChild(node, this.node)
      } else {
        this.node.remove()
      }
      this.node = node as NN
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  sendMessage(message: any, origin = '*', transfer?: Transferable[]) {
    console.log(
      `%c[ComponentPage] Sending message to origin: ${origin}`,
      `color:#95a5a6;`,
      message,
    )
    // window.parent.postMessage(message, origin)
    this.window.postMessage(message, origin)
  }
}

export default ComponentPage

import { Identify } from 'noodl-types'
import * as u from '@jsmanifest/utils'
import type { ComponentPage } from './factory/componentFactory'
import {
  getElementTag,
  getNodeIndex,
  handleDrawGlobalComponent,
  openOutboundURL,
  _getOrCreateComponentPage,
  _isPluginComponent,
  _resetActions,
  _resetComponentCache,
  _resetRegisters,
  _resetTransactions,
  removeAllNode,
} from './utils'
import GlobalComponentRecord from './global/GlobalComponentRecord'
import componentFactory from './factory/componentFactory/componentFactory'
import globalFactory from './factory/globalFactory'
import isComponent from '../utils/isComponent'
import isComponentPage from '../utils/isComponentPage'
import isNDOMPage from '../utils/isNDOMPage'
import isNUIPage from '../utils/isPage'
import NDOMInternal from './Internal'
import NDOMGlobal from './Global'
import NDOMPage from './Page'
import NUIPage from '../Page'
import attributeResolvers from './resolvers/attributes'
import componentResolvers from './resolvers/components'
import cache from '../_cache'
import nui from '../noodl-ui'
import { findParent, findIteratorVar } from '../utils/noodl'
import Resolver from './Resolver'
import { _isIframeEl, _syncPages, _TEST_ } from './utils'
import * as c from '../constants'
import * as t from '../types'
import log from '../utils/log'
import { set } from 'lodash'

const pageEvt = c.eventId.page
const defaultResolvers = [attributeResolvers, componentResolvers]
class NDOM extends NDOMInternal {
  #R: Resolver
  #createElementBinding = undefined as t.UseObject['createElementBinding']
  #hooks = {
    onRedrawStart: [],
    onBeforeRequestPageObject: [],
    onAfterRequestPageObject: [],
  } as Record<keyof t.Hooks, t.Hooks[keyof t.Hooks][]>
  #mutationObservers: Map<string, MutationObserver[]>
  #renderState = {
    draw: {
      active: {} as {
        [pageId: string]: { pageName: string; timestamp: Number | null }
      },
      loading: {} as {
        [pageId: string]: { pageName: string; timestamp: Number | null }
      },
    },
    options: { hooks: {} as NonNullable<t.ResolveComponentOptions<any>['on']> },
  }
  consumerResolvers = [] as t.Resolve.Config[]
  global = new NDOMGlobal()
  // @ts-expect-error
  page: NDOMPage; // This is the main (root) page. All other pages are stored in this.global.pages

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      consumerResolvers: this.consumerResolvers,
      global: {
        components: this.global.components,
        pages: this.global.pages,
        pageIds: this.global.pageIds,
        pageNames: this.global.pageNames,
        timers: this.global.timers,
        interval: this.global.intervals,
      },
      hooks: this.hooks,
      resolvers: this.resolvers,
    }
  }

  constructor() {
    super()
    this.#R = new Resolver()
    this.#mutationObservers = new Map()
    _syncPages.call(this)
  }

  get actions() {
    return cache.actions
  }

  get builtIns() {
    return this.actions.builtIn
  }

  get cache() {
    return cache
  }

  get hooks() {
    return this.#hooks
  }

  get length() {
    return u.keys(this.global.pages).length
  }

  get pages() {
    return this.global.pages
  }

  get resolvers() {
    return [...defaultResolvers, ...this.consumerResolvers]
  }

  get renderState() {
    return this.#renderState
  }

  get transactions() {
    return cache.transactions
  }

  createPage(nuiPage: NUIPage): NDOMPage | ComponentPage
  createPage(component: t.NuiComponent.Instance, node?: any): ComponentPage
  createPage(
    args: Parameters<(typeof nui)['createPage']>[0],
  ): NDOMPage | ComponentPage
  createPage(args: {
    page: NUIPage
    viewport?: { width?: number; height?: number }
  }): ComponentPage | NDOMPage
  createPage(name: string): NDOMPage
  createPage(
    args?:
      | t.NuiComponent.Instance
      | NUIPage
      | Parameters<(typeof nui)['createPage']>[0]
      | { page: NUIPage; viewport?: { width?: number; height?: number } }
      | string,
    node?: any,
  ) {
    let page: NDOMPage | ComponentPage | undefined

    const createComponentPage = (arg: NUIPage | t.NuiComponent.Instance) => {
      if (arg?.id === 'root') {
        if (!isNUIPage(arg)) {
          log.log(
            `%cA root NDOMPage is being instantiated but the argument given was not a NUIPage`,
            `color:#ec0000;`,
            arg,
          )
        }
        return new NDOMPage(arg as NUIPage)
      }

      return componentFactory.createComponentPage(
        arg as t.NuiComponent.Instance,
        {
          node,
          onLoad: (evt, node) => {
            log.log(
              `%c[onLoad] NuiPage loaded for page "${page?.page}" on a page component`,
              `color:#00b406;`,
              { event: evt, node },
            )
          },
          onError: (err) => {
            log.log(
              `%c[onError] Error creating an NDOM page for a page component: ${err.message}`,
              `color:#ec0000;`,
              err,
            )
          },
        },
      )
    }

    if (isNUIPage(args)) {
      return this.findPage(args) || createComponentPage(args)
    } else if (isComponent(args)) {
      return this.findPage(args) || createComponentPage(args)
    } else if (u.isObj(args)) {
      if ('page' in args) {
        return this.createPage(args.page)
      } else if ('component' in args) {
        return this.createPage(args.component)
      } else {
        args.id && (page = this.findPage(args.id))
        if (!page) return createComponentPage(nui.createPage(args) as NUIPage)
      }
    } else if (u.isStr(args) || u.isNum(args)) {
      if (args === '') {
        page = this.findPage('')
        // Dispose the old one for the new one since we only support 1 loading
        // page at a time
        if (page) {
          if (page.id === 'root') {
            if (!this.page) this.page = page
          } else {
            this.removePage(page)
            return this.createPage('')
          }
        } else {
          page = createComponentPage(
            nui.createPage({
              id: this.global.pageIds.includes('root') ? args || '' : 'root',
              name: '',
            }) as NUIPage,
          )
          // NOTE/TODO - Fix this so that it reuses the existing main page
          if (page.id === 'root' && this.page !== page) this.page = page
          return page
        }
      } else {
        return (
          this.findPage(args) ||
          createComponentPage(nui.createPage({ name: args }) as NUIPage)
        )
      }
    } else {
      return createComponentPage(nui.createPage({ name: args }) as NUIPage)
    }

    return page
  }

  createGlobalRecord<T extends 'component'>(args: {
    type: T
    component: t.NuiComponent.Instance
    node?: HTMLElement | null
    page: NDOMPage
  }) {
    switch (args.type) {
      case 'component': {
        const createResource = globalFactory.createResource(
          GlobalComponentRecord,
        )
        const createRecord = createResource(args.type, (record) => {
          this.global.components.set(record.globalId, record)
        })
        return createRecord({
          component: args.component,
          node: args.node as HTMLElement,
          page: args.page || this.page,
        })
      }
    }
  }

  /**
   * @param args[0] Page name (Defaults to `'root'`) or callback
   * @param args[1] Callback
   */
  createMutationObserver(
    callback: MutationCallback,
    /**
     * Callback invoked (when manually disconnected, not during ndom.render) when observer is disconnected. Unhandled/leftover {@link MutationRecord}s are passed as arguments
     */
    onDisconect?: (mutations: MutationRecord[]) => void,
  ): MutationObserver
  createMutationObserver(
    pageId: string,
    callback: MutationCallback,
    /**
     * Callback invoked (when manually disconnected, not during ndom.render) when when observer is disconnected. Unhandled/leftover {@link MutationRecord}s are passed as arguments
     */
    onDisconect?: (mutations: MutationRecord[]) => void,
  ): MutationObserver
  createMutationObserver(...args: unknown[]): MutationObserver {
    let pageId = ''
    let callback: MutationCallback | undefined
    let onDisconnect: ((mutations: MutationRecord[]) => void) | undefined

    if (args.length > 1) {
      if (u.isFnc(args[0])) {
        callback = args[0]
        onDisconnect = args[1] as any
      } else {
        pageId = args[0] as string
        callback = args[1] as MutationCallback
        onDisconnect = args[2] as any
      }
    } else {
      pageId = args[0] as string
    }

    if (!pageId) pageId = 'root'

    const _onMutation: MutationCallback = (mutations, observer) => {
      callback?.(mutations, observer)
    }

    const observer = new MutationObserver(_onMutation)

    if (!this.#mutationObservers.has(pageId)) {
      this.#mutationObservers.set(pageId, [])
    }

    this.#mutationObservers.set(
      pageId,
      this.#mutationObservers.get(pageId)!.concat(observer),
    )

    return {
      observe: observer.observe.bind(observer),
      disconnect: () => {
        const observers = this.#mutationObservers.get(pageId)
        if (observers?.length) {
          const index = observers.indexOf(observer)
          if (index > -1) observers.splice(index, 1)
        }
        observer.disconnect()
        if (onDisconnect) onDisconnect(observer.takeRecords())
      },
      takeRecords: observer.takeRecords.bind(observer),
    }
  }

  /**
   * Finds and returns the associated NDOMPage from NUIPage
   * @param NUIPage nuiPage
   * @returns NDOMPage | null
   */
  findPage(nuiPage: NUIPage | NDOMPage | string | null): NDOMPage
  findPage(
    pageComponent: t.NuiComponent.Instance,
    currentPage?: string,
  ): ComponentPage
  findPage(
    nuiPage: t.NuiComponent.Instance | NUIPage | NDOMPage | string | null,
    currentPage?: string,
  ) {
    if (isComponent(nuiPage)) {
      if (this.global.pages?.[nuiPage?.id]) return this.global.pages[nuiPage.id]
      let component = nuiPage
      let _nuiPage = component.get('page') as NUIPage
      let pagePath = component.get('path') as string
      if (isNUIPage(_nuiPage)) return this.findPage(_nuiPage)
      if (u.isStr(pagePath) || u.isStr(currentPage)) {
        return (
          (currentPage && this.findPage(currentPage)) || this.findPage(pagePath)
        )
      }
      const pageComponentParent = findParent(component, Identify.component.page)
      if (pageComponentParent) {
        return (
          u
            .values(this.global.pages)
            // @ts-expect-error
            .find((p) => p.component === pageComponentParent)
        )
      }
    } else if (isNUIPage(nuiPage)) {
      for (const page of u.values(this.global.pages)) {
        if (page.getNuiPage() === nuiPage) return page
        if (page.getNuiPage()?.created === nuiPage.created) return page
        if (this.findPage(page.id)?.getNuiPage?.() === nuiPage) return page
        if (this.findPage(page.page)?.getNuiPage?.() === nuiPage) return page
        if (this.findPage(page.requesting)?.getNuiPage?.() === nuiPage) {
          return page
        }
      }
      return this.findPage(nuiPage.id as string)
    } else if (isNDOMPage(nuiPage)) {
      return nuiPage
    } else if (u.isStr(nuiPage)) {
      if (nuiPage === '') {
        // If it is an ID (from a component or page instance, return the existing one if there is one)
      } else {
        // If it is a page name, return and re-use an existing page if there is one
        if (nuiPage in this.global.pages) return this.global.pages[nuiPage]
        const page = u.values(this.pages).find((pg) => pg.page === nuiPage)
        if (page && page.id !== 'root') return page
      }
    }
    return null
  }

  on<Evt extends keyof t.Hooks>(evt: Evt, fn: t.Hooks[Evt]) {
    this.#hooks[evt].push(fn)
    return this
  }

  /**
   * Initiates a request to the parameters set in Page.
   * The page.requesting value should be set prior to calling this method unless
   * pageRequesting is provided. If it is provided, it will be set automatically
   */
  async request(page = this.page, pageRequesting = '') {
    // Cache the currently requesting page to detect for newer requests during the call
    pageRequesting = pageRequesting || page.requesting || ''
    if ((window as any).pcomponents) {
      const rootComponents = (window as any).pcomponents[0]
      this.removeComponentListener(rootComponents)
    }
    try {
      // This is needed for the consumer to run any operations prior to working
      // with the components (ex: processing the "init" in page objects)
      await this.transact(c.nuiEmitTransaction.REQUEST_PAGE_OBJECT, page)
      /**
       * TODO - Move this to an official location when we have time
       */
      const action = async (cb: () => any | Promise<any>) => {
        try {
          if (
            (!pageRequesting && page.requesting) ||
            pageRequesting === page.requesting
          ) {
            await cb()
          } else if (page.requesting) {
            log.log(
              `%cAborting this navigate request to ${pageRequesting} because` +
                `a more recent request for "${page.requesting}" was instantiated`,
              `color:#FF5722;`,
              { pageAborting: pageRequesting, pageRequesting: page.requesting },
            )
            delete page.modifiers[pageRequesting]
            return log.error(
              `A more recent request from "${pageRequesting}" to "${page.requesting}" was called`,
            )
          }
        } catch (error) {
          throw error
        }
      }

      page.setStatus(pageEvt.status.NAVIGATING)

      // Outside link
      if (pageRequesting.startsWith('http')) {
        await action(() => void (page.requesting = ''))
        return openOutboundURL(pageRequesting)
      }

      await action(() => {
        page.emitSync(pageEvt.on.ON_NAVIGATE_START, page)
        !_TEST_ && history.pushState({}, '', page.pageUrl)
      })

      await action(() => {
        page.previous = page.page
        page.page = page.requesting
        page.requesting = ''
      })
    } catch (error) {
      if (pageRequesting === page.requesting) page.requesting = ''
      throw error instanceof Error ? error : new Error(error)
    }

    return {
      render: this.render.bind(this, page),
    }
  }

  /**
   * Takes a list of raw noodl components, converts them to their corresponding
   * DOM nodes and appends to the DOM
   *
   * @param { NDOMPage } page
   * @returns t.NuiComponent.Instance
   */
  async render(
    page: NDOMPage,
    options?:
      | t.ResolveComponentOptions<any>['callback']
      | Omit<t.ResolveComponentOptions<any>, 'components' | 'page'>,
  ) {
    const resolveOptions = u.isFnc(options) ? { callback: options } : options
    if (resolveOptions?.on) {
      const hooks = resolveOptions.on
      const currentHooks = this.renderState.options.hooks
      hooks.actionChain && (currentHooks.actionChain = hooks.actionChain)
      hooks.createComponent &&
        (currentHooks.createComponent = hooks.createComponent)
      hooks.emit && (currentHooks.emit = hooks.emit)
      hooks.if && (currentHooks.if = hooks.if)
      hooks.setup && (currentHooks.setup = hooks.setup)
    }
    // REMINDER: The value of this page's "requesting" is empty at this moment
    // Create the root node where we will be placing DOM nodes inside.
    // The root node is a direct child of document.body
    page.setStatus(c.eventId.page.status.RESOLVING_COMPONENTS)

    this.reset('componentCache', page)
    const nuiPage = page.getNuiPage()
    const components = u.array(
      await nui.resolveComponents({
        components: page.components,
        page: nuiPage,
        ...resolveOptions,
      } as any),
    ) as t.NuiComponent.Instance[]
    page.setStatus(c.eventId.page.status.COMPONENTS_RECEIVED)
    page.emitSync(c.eventId.page.on.ON_DOM_CLEANUP, {
      global: this.global,
      node: page.node,
    })

    /**
     * Page components use NDOMPage instances that use their node as an
     * HTMLIFrameElement. They will have their own way of clearing their tree
     */
    if (window?.['pcomponents']) {
      const rootComponents = window?.['pcomponents'][0]
      this.removeComponentListener(rootComponents)
      this.removeComponent(rootComponents)
    }
    !_isIframeEl(page.node) && page.clearNode()
    page.setStatus(c.eventId.page.status.RENDERING_COMPONENTS)
    page.emitSync(pageEvt.on.ON_BEFORE_RENDER_COMPONENTS, {
      ...page.snapshot({ components }),
      observers: this.#mutationObservers,
    })

    // Clean up mutation observers
    const observers = this.#mutationObservers.get(page.id!)!
    if (observers?.length) {
      while (observers.length) {
        const observer = observers.pop()
        if (observer !== undefined) {
          observer.disconnect()
          observer.takeRecords()
        }
      }
    }

    // const numComponents = components.length
    // for (let index = 0; index < numComponents; index++) {
    //   await this.draw(components[index] as any, page.node, page, resolveOptions)
    // }

    if (['MeetingPage', 'VideoChat'].includes(this.global.pageNames[0])) {
      const numComponents = components.length
      for (let index = 0; index < numComponents; index++) {
        await this.draw(
          components[index] as any,
          page.node,
          page,
          resolveOptions,
        )
      }
    } else {
      await Promise.all(
        components.map(async (component) => {
          this.draw(component as any, page.node, page, resolveOptions)
        }),
      )
    }

    // await Promise.all(
    //   components.map(async (component) => {
    //     await this.draw(component as any, page.node, page, resolveOptions)
    //   }),
    // )

    page.emitSync(c.eventId.page.on.ON_COMPONENTS_RENDERED, page)
    page.setStatus(c.eventId.page.status.COMPONENTS_RENDERED)
    return components as t.NuiComponent.Instance[]
  }

  /**
   * Parses props and returns a DOM node described by props. This also
   * resolves its children hieararchy until there are none left
   * @param { Component } props
   */
  async draw<Context extends Record<string, any> = any>(
    component: t.NuiComponent.Instance,
    container?: t.NDOMElement | null,
    pageProp?: NDOMPage,
    options?: Pick<
      Partial<t.ResolveComponentOptions<any, Context>>,
      'callback' | 'context' | 'on'
    > & {
      nodeIndex?: number
      /**
       * Callback called when a page component finishes loading its element in the DOM. The resolvers are run on the page node before this callback fires. The caller is responsible for handling the page component's children
       * @param options
       */
      onPageComponentLoad?(options: {
        event: Event
        node: HTMLIFrameElement
        component: t.NuiComponent.Instance
        page: NDOMPage
      }): void
    },
    dataOptions?: any,
  ) {
    let hooks = options?.on
    let node: t.NDOMElement | null = null
    let page: NDOMPage = pageProp || this.page

    try {
      if (component) {
        if (_isPluginComponent(component)) {
          // We will delegate the role of the node creation to the consumer (only enabled for plugin components for now)
          const getNode = (elem: HTMLElement) => (node = elem || node)
          await this.#R.run({
            on: hooks,
            ndom: this,
            // @ts-expect-error
            node: getNode,
            component,
            page,
            resolvers: this.resolvers,
          })

          return node
        } else if (Identify.component.image(component)) {
          if (this.#createElementBinding) {
            node = this.#createElementBinding(component) as HTMLElement
          }
          if (!node) {
            node = document.createElement('img')
          }
          // set img empty with css
          // if (node) {
          //   node.setAttribute(
          //     'src',
          //     'null.svg',
          //   )
          // }
          // try {
          //   if (Identify.folds.emit(component.blueprint?.path)) {
          //     try {
          //       node = await createAsyncImageElement(container as HTMLElement)
          //       const result = component.get(c.DATA_SRC)
          //       if (result?.then) {
          //         result.then((res: any) => {
          //           let re = res.find((val: any) => !!val?.result)?.result
          //           re = `${nui.getAssetsUrl()}/${re}`
          //           node && ((node as HTMLImageElement).src = re)
          //         })
          //       } else {
          //         node && ((node as HTMLImageElement).src = result)
          //       }
          //     } catch (error) {
          //       log.error(error)
          //     }
          //   }
          // } catch (error) {
          //   log.error(error)
          // } finally {
          //   if (!node) {
          //     node = document.createElement('img')
          //     const result = component.get(c.DATA_SRC)
          //     if (result?.then) {
          //       result.then((res: any) => {
          //         let re = res.find((val: any) => !!val?.result)?.result
          //         re = re ? resolveAssetUrl(re, nui.getAssetsUrl()) : ''
          //         ;(node as HTMLImageElement).src = re
          //       })
          //     } else {
          //       ;(node as HTMLImageElement).src = result
          //     }
          //   }
          // }
        } else if (Identify.component.page(component)) {
          const componentPage = _getOrCreateComponentPage(
            component,
            this.createPage.bind(this),
            this.findPage.bind(this),
          )
          node = document.createElement(getElementTag(component))
          componentPage.replaceNode(node as HTMLIFrameElement)
        } else {
          node = this.#createElementBinding?.(component) || null
          node && (node['isElementBinding'] = true)
          !node && (node = document.createElement(getElementTag(component)))
        }
        if (component.has?.('global')) {
          handleDrawGlobalComponent.call(this, node, component, page)
        }
        if (component.type === 'register') {
          const onEvent = component.get('onEvent')
          this.global.register.set(onEvent, component)
        }
      }

      if (node) {
        const parent = component.has?.('global')
          ? document.body
          : container || document.body
        // log.log(count,"kkkk")
        // NOTE: This needs to stay above the code below or the children will
        // not be able to access their parent during the resolver calls
        if (!parent.contains(node)) {
          if (u.isObj(options) && u.isNum(options.nodeIndex)) {
            parent.insertBefore(node, parent.children.item(options.nodeIndex))
          } else {
            parent.appendChild(node)
          }
        }
        if (Identify.component.page(component)) {
          const pagePath = component.get('path')
          const childrenPage = this.findPage(pagePath)
          await this.#R.run({
            on: hooks,
            ndom: this,
            node,
            component,
            page: childrenPage || page,
            resolvers: this.resolvers,
          })
        } else {
          await this.#R.run({
            on: hooks,
            ndom: this,
            node,
            component,
            page,
            resolvers: this.resolvers,
          })

          /**
           * Creating a document fragment and appending children to them is a
           * minor improvement in first contentful paint on initial loading
           * https://web.dev/first-contentful-paint/
           */
          let childrenContainer = Identify.component.list(component)
            ? document.createDocumentFragment()
            : node

          for (const child of component.children) {
            const childNode = (await this.draw(
              child,
              node,
              page,
              {
                ...options,
                on: hooks,
              },
              dataOptions,
            )) as HTMLElement
            childNode && childrenContainer?.appendChild(childNode)
          }

          if (dataOptions?.focus === node.getAttribute('data-viewtag')) {
            setTimeout(() => {
              node?.focus()
              //@ts-expect-error
              node?.setSelectionRange(-1, -1)
            })
          }
          if (
            childrenContainer.nodeType ===
            childrenContainer.DOCUMENT_FRAGMENT_NODE
          ) {
            node.appendChild(childrenContainer)
          }
          childrenContainer = null as any
        }
      }
    } catch (error) {
      log.error(error)
      throw error
    }
    return node || null
  }
  async redraw<C extends t.NuiComponent.Instance>(
    node: t.NDOMElement | null, // ex: li (dom node)
    component: C, // ex: listItem (component instance)
    pageProp?: NDOMPage,
    options?: Parameters<NDOM['draw']>[3],
    dataOptions?: any,
  ) {
    let context: any = options?.context
    let isPageComponent = Identify.component.page(component)
    let newComponent: t.NuiComponent.Instance | undefined
    let page =
      pageProp ||
      (isPageComponent && this.findPage(component)) ||
      this.page ||
      this.createPage({ id: component?.id || node?.id })
    let parent = component?.parent
    let index = component.get('index') || 0

    try {
      let oldViewTag, newViewTag
      if (component) {
        oldViewTag = component.get(c.DATA_VIEWTAG)
        if (Identify.component.listItem(component)) {
          const iteratorVar =
            findIteratorVar(component) ||
            component?.parent?.blueprint?.iteratorVar
          if (iteratorVar) {
            const index = component.get('index') || 0
            context = { ...context }
            context.index = index
            context.dataObject =
              context?.dataObject ||
              component.get(iteratorVar) ||
              context.listObject?.[index]
            context.iteratorVar = iteratorVar
          }
        }
        if (component.type === 'chatList' && node) {
          let hooks = options?.on
          await this.#R.runOnly({
            on: hooks,
            ndom: this,
            node: node,
            component,
            page,
            resolvers: this.resolvers,
            resolveName: '[App] chatList',
          })
          return [node, component] as [typeof node, typeof component]
        }
        // page?.emitSync?.(c.eventId.page.on.ON_REDRAW_BEFORE_CLEANUP, {
        //   parent: component?.parent as t.NuiComponent.Instance,
        //   component,
        //   context,
        //   node,
        //   page,
        // })

        // log.log(component.get("lazyCount"),newComponent,component,"kkkkk");
        // log.log('test86',component,component.children.length,component.defaultChildren.length)
        // log.log('test87',newComponent,newComponent.length,newComponent.defaultChildren.length)
        // if(component.children.length === 0 &&  component.defaultChildren.length>0){
        //   newComponent.removeChild()
        //   for(const child of component.defaultChildren){
        //     newComponent.createChild(child)
        //   }
        //   log.log('test88',newComponent)
        // }
        // let scrollHeight:any = 0
        // if (component.type === 'chatList') {
        //       scrollHeight = node?.scrollHeight
        //       newComponent.set('scrollheight',scrollHeight)
        // }
        // this.removeComponentListener(component)
        if (
          component.get('lazyCount') > 0 &&
          component.get('lazyState') &&
          component.get('lazyload') !== false &&
          component.get('lazyloading')
        ) {
          const allData = component.get('listObject')
          const currentNodeLength = component.children.length
          if (allData.length > currentNodeLength) {
            const latestData = allData.slice(currentNodeLength - allData.length)
            const componentBlueprintTemp = u.cloneDeep(
              component.children[0].blueprint,
            )
            if (u.isArr(latestData) && latestData.length > 0) {
              Promise.all(
                latestData.map(async (data, arrIndex) => {
                  componentBlueprintTemp.itemObject = data
                  const itemComponent = nui.createComponent(
                    componentBlueprintTemp,
                    page?.getNuiPage?.(),
                  )
                  const index = currentNodeLength + arrIndex
                  itemComponent.setParent(component)
                  component.createChild(itemComponent)
                  itemComponent.edit({ index })
                  await nui.resolveComponents?.({
                    callback: options?.callback,
                    components: itemComponent,
                    page: page?.getNuiPage?.(),
                    context: {
                      ...context,
                      dataObject: data,
                    },
                    on: options?.on || this.renderState.options.hooks,
                  })
                  if (node) {
                    await this.draw(itemComponent as any, node, page, {
                      ...dataOptions,
                      dataObject: data,
                    })
                  }
                }),
              )
            }
          }
        } else {
          page?.emitSync?.(c.eventId.page.on.ON_REDRAW_BEFORE_CLEANUP, {
            parent: component?.parent as t.NuiComponent.Instance,
            component,
            context,
            node,
            page,
          })
          newComponent = nui.createComponent(
            component.blueprint,
            page?.getNuiPage?.(),
          )
          if (parent) {
            newComponent.setParent(parent)
            parent.createChild(newComponent)
          }
          if (index) {
            newComponent.edit({ index })
          }
          set(nui.getRoot(), 'options', '')
          this.removeComponentListener(component)
          this.removeComponent(component)
          newComponent = await nui.resolveComponents?.({
            callback: options?.callback,
            components: newComponent,
            page: page?.getNuiPage?.(),
            context,
            on: options?.on || this.renderState.options.hooks,
          })
          newViewTag = newComponent.get(c.DATA_VIEWTAG)
        }
        !(
          component.get('lazyCount') > 0 &&
          component.get('lazyState') &&
          component.get('lazyload') !== false &&
          component.get('lazyloading')
        ) && this.removeComponentListener(component)
        // newComponent.copyFromChildrenToDefault()
      }
      if (node) {
        if (newComponent) {
          if (
            component.get('lazyCount') > 0 &&
            component.get('lazyState') &&
            component.get('lazyload') !== false &&
            component.get('lazyloading')
          ) {
            // let newNode = await this.draw(newComponent, node, page, {
            //   ...options,
            //   on: options?.on || this.renderState.options.hooks,
            //   context,
            //   nodeIndex: getNodeIndex(node),
            // },dataOptions)
            // node = newNode
          } else {
            let parentNode = node.parentNode as HTMLElement
            let currentIndex = getNodeIndex(node)
            const scrollTop = node.scrollTop
            let newNode = await this.draw(
              newComponent,
              parentNode,
              page,
              {
                ...options,
                on: options?.on || this.renderState.options.hooks,
                context,
                nodeIndex: currentIndex,
              },
              dataOptions,
            )
            if (parentNode) {
              // @ts-expect-error
              parentNode.replaceChild(newNode, node)
              removeAllNode(node)
            } else {
              removeAllNode(node)
            }
            newNode &&
              newViewTag === oldViewTag &&
              !u.isNil(newViewTag) &&
              (newNode.scrollTop = scrollTop)
            node = newNode as HTMLElement
            newNode = null
            parentNode = null as any
          }
        }
      }
    } catch (error) {
      log.error(error)
      throw new Error(error)
    }
    if (
      component.get('lazyCount') > 0 &&
      component.get('lazyState') &&
      component.get('lazyload') !== false &&
      component.get('lazyloading')
    ) {
      component.set('lazyloading', false)
      return [node, component] as [typeof node, typeof component]
    } else {
      return [node, newComponent] as [typeof node, typeof component]
    }
  }

  register(obj: t.Store.ActionObject): this
  register(obj: t.Store.BuiltInObject): this
  register(obj: t.Store.ActionObject | t.Store.BuiltInObject): this {
    if ('actionType' in obj || 'funcName' in obj) {
      nui.use({ [obj.actionType]: obj })
    }
    return this
  }

  reset(key: 'componentCache', page: NDOMPage): this
  reset(opts?: {
    componentCache?: boolean
    global?: boolean
    pages?: boolean
    register?: boolean
    transactions?: boolean
  }): this
  reset(key?: 'actions' | 'componentCache' | 'register' | 'transactions'): this
  reset(
    key?:
      | {
          actions?: boolean
          componentCache?: boolean
          global?: boolean
          hooks?: boolean
          pages?: boolean
          register?: boolean
          transactions?: boolean
        }
      | 'actions'
      | 'componentCache'
      | 'hooks'
      | 'register'
      | 'transactions',
    page?: NDOMPage,
  ) {
    const _pageName = page?.requesting || page?.page
    const resetHooks = () => u.forEach(u.clearArr, u.values(this.hooks))
    const resetPages = () => {
      this.page = undefined as any
      u.forEach((p) => this.removePage(p), u.values(this.pages))
      cache.page.clear()
    }

    const resetGlobal = () => {
      // Global components
      u.forEach(
        (c) => this.removeGlobalRecord(c),
        [...this.global.components.values()],
      )
      // Global timers
      // TODO - check if there is a memory leak here
      u.forEach((k) => delete this.global.timers[k], u.keys(this.global.timers))
      resetPages()
    }

    if (key !== undefined) {
      if (u.isObj(key)) {
        key.componentCache && _resetComponentCache(_pageName)
        key.global && resetGlobal()
        key.hooks && resetHooks()
        key.pages && resetPages()
        key.transactions && _resetTransactions()
      } else if (key === 'actions') _resetActions()
      else if (key === 'componentCache') _resetComponentCache(_pageName)
      else if (key === 'hooks') resetHooks()
      else if (key === 'register') _resetRegisters()
      else if (key === 'transactions') _resetTransactions()
      return this
    }
    // The operations below is equivalent to a "full reset"
    u.callAll(
      _resetActions,
      _resetComponentCache,
      resetGlobal,
      resetHooks,
      resetPages,
      _resetRegisters,
      _resetTransactions,
    )()

    return this
  }

  resync() {
    return _syncPages.call(this)
  }

  async transact<Tid extends t.NDOMTransactionId>(
    transaction: Tid,
    ...args: Parameters<t.NDOMTransaction[Tid]>
  ) {
    if (transaction === c.nuiEmitTransaction.REQUEST_PAGE_OBJECT) {
      u.forEach(
        (fn) => fn?.(args[0] as any),
        this.#hooks.onBeforeRequestPageObject,
      )
    }
    // @ts-expect-error
    const result = cache.transactions.get(transaction)?.['fn']?.(...args)
    if (transaction === c.nuiEmitTransaction.REQUEST_PAGE_OBJECT) {
      u.forEach(
        (fn) => fn?.(args[0] as any),
        this.#hooks.onAfterRequestPageObject,
      )
    }
    return result
  }

  removeComponent(component: t.NuiComponent.Instance | undefined | null) {
    if (!component) return
    const remove = (_c: t.NuiComponent.Instance) => {
      cache.component.remove(_c)
      ;(_c.has?.('global') || _c.blueprint?.global) &&
        this.removeGlobalComponent(_c.get(c.DATA_GLOBALID))
      _c?.setParent?.(null)
      _c?.parent?.removeChild(_c)
      _c.children?.forEach?.((_c) => remove(_c))
      _c.has('page') && _c.remove('page')
      _c.has('signaturePad') && _c.remove('signaturePad')
      if (Object.getOwnPropertyDescriptor(this, '_ref_')) {
        Object.defineProperty(this, '_ref_', {})
        Object.defineProperty(this, '_path_', {})
      }

      Object.defineProperty(this, 'get', {})
      _c.clear?.()
      return
    }
    remove(component)
    return
  }
  removeComponentListener(
    component: t.NuiComponent.Instance | undefined | null,
  ) {
    if (!component) return
    const remove = (_c: t.NuiComponent.Instance) => {
      if (_c.has('signaturePad')) {
        const signaturePad = _c.get('signaturePad')
        signaturePad.off()
        _c.remove(signaturePad)
      }
      if (Object.getOwnPropertyDescriptor(this, '_ref_')) {
        Object.defineProperty(this, '_ref_', {})
        Object.defineProperty(this, '_path_', {})
      }

      Object.defineProperty(this, 'get', {})

      _c.clear('hooks')
      _c.removeAllEventListeners()
      _c.children?.forEach?.((_c) => remove(_c))
      return
    }
    remove(component)
    return
  }

  removeGlobalComponent(globalMap: NDOMGlobal, globalId = '') {
    if (globalId) {
      if (globalMap.components.has(globalId)) {
        const globalComponentObj = globalMap.components.get(globalId)
        const obj = globalComponentObj?.toJSON()
        if (obj) {
          const { componentId, nodeId } = obj
          if (componentId) {
            if (cache.component.has(componentId)) {
              this.removeComponent(cache.component.get(componentId)?.component)
            }
          }
          this.global.components.delete(globalId)
          if (nodeId) {
            const node = document.querySelector(
              `[data-key="${globalId}"]`,
            ) as HTMLElement
            node && this.removeNode(node)
          }
        }
      }
    }
  }

  removeGlobalRecord({ componentId, globalId, nodeId }: GlobalComponentRecord) {
    nodeId && document.getElementById(nodeId)?.remove?.()
    if (cache.component.has(componentId)) {
      this.removeComponent(cache.component.get(componentId)?.component)
    }
    this.removeGlobalComponent(this.global, globalId)
  }

  /**
   * Removes the node from the DOM by parent/child references
   */
  removeNode(node: t.NDOMElement) {
    if (node) {
      try {
        node.parentNode?.removeChild?.(node)
        node.remove?.()
      } catch (error) {
        log.error(error)
      }
    }
  }

  /**
   * Removes the NDOMPage from the {@link GlobalMap}
   */
  removePage(page: NDOMPage | undefined | null) {
    if (page) {
      const id = page.id
      nui.clean(page.getNuiPage())
      page.remove()
      if (this?.global?.pages) {
        // @ts-expect-error
        if (id in this.global.pages) delete this.global.pages[id]
      }
      try {
        if (isComponentPage(page)) {
          page.clear()
        } else {
          page.remove()
          page?.node?.remove?.()
        }
      } catch (error) {
        log.error(error)
      }
      page = null
    }
  }

  use(obj: NUIPage | Partial<t.UseObject>) {
    if (!obj) return
    if (isNUIPage(obj)) return this.findPage(obj) || this.createPage(obj)

    const { createElementBinding, resolver, transaction, ...rest } = obj

    createElementBinding && (this.#createElementBinding = createElementBinding)
    resolver && this.consumerResolvers.push(resolver)

    if (transaction) {
      u.entries(transaction).forEach(([id, val]) => {
        if (id === c.nuiEmitTransaction.REQUEST_PAGE_OBJECT) {
          nui.use({
            transaction: {
              [c.nuiEmitTransaction.REQUEST_PAGE_OBJECT]: async (
                nuiPage: NUIPage,
              ) => {
                if (
                  !u.isFnc(
                    transaction[c.nuiEmitTransaction.REQUEST_PAGE_OBJECT],
                  )
                ) {
                  throw new Error(
                    `Missing transaction: ${c.nuiEmitTransaction.REQUEST_PAGE_OBJECT}`,
                  )
                }

                let page = this.findPage(nuiPage)
                if (page) {
                  !page.requesting && (page.requesting = nuiPage?.page || '')
                } else {
                  page = this.createPage(nuiPage)
                  page.requesting = nuiPage.page
                }
                return transaction[c.nuiEmitTransaction.REQUEST_PAGE_OBJECT]?.(
                  page,
                )
              },
            },
          })
        } else {
          nui.use({ transaction: { [id]: val } })
        }
      })
    }

    nui.use(rest)
    return this
  }
}

export default NDOM

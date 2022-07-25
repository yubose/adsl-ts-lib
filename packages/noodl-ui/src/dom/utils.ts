/**
 * Internal utilities (not exported)
 */
import * as u from '@jsmanifest/utils'
import type { LiteralUnion } from 'type-fest'
import curry from 'lodash/curry'
import get from 'lodash/get'
import { Identify } from 'noodl-types'
import { OrArray } from '@jsmanifest/typefest'
import type { ComponentObject, EcosDocument, NameField } from 'noodl-types'
import type { ComponentPage } from './factory/componentFactory'
import type GlobalComponentRecord from './global/GlobalComponentRecord'
import type NDOM from './noodl-ui-dom'
import type NDOMPage from './Page'
import type NUIPage from '../Page'
import cache from '../_cache'
import findElement from '../utils/findElement'
import { findParent, pullFromComponent } from '../utils/noodl'
import is from '../utils/is'
import isComponent from '../utils/isComponent'
import isComponentPage from '../utils/isComponentPage'
import isNDOMPage from '../utils/isNDOMPage'
import isNuiPage from '../utils/isPage'
import * as t from '../types'
import * as c from '../constants'
import { keyBy } from 'lodash'

export const _DEV_ = process.env.NODE_ENV === 'development'
export const _TEST_ = process.env.NODE_ENV === 'test'

export function addClassName(className: string, node: HTMLElement) {
  if (!node.classList.contains(className)) {
    node.classList.add(className)
  }
}

type CreateDocIdentifierArg =
  | t.NuiComponent.Instance
  | ComponentObject
  | EcosDocument<NameField>
  | null
  | undefined

function _createDocIdentifier(
  mediaType: number,
  regex: { value: string; flags?: string },
): (obj: CreateDocIdentifierArg) => boolean
function _createDocIdentifier(
  mediaType: number,
  regex: string,
): (obj: CreateDocIdentifierArg) => boolean
function _createDocIdentifier(
  mediaType: number,
  regexStr: string | { value: string; flags?: string },
) {
  /**
   * A helper to grab a value from key from a component or action
   * @param { t.NuiComponent | ComponentObject | NUIAction | NUIActionObjectInput } obj
   * @param { string } key
   */
  function _pick(obj: any, key: string, defaultValue?: any) {
    if (!u.isObj(obj)) return obj
    let result
    if (key === 'name.type') {
      if (obj?.name?.type) {
        const val = get(obj, key)
        if (val !== undefined && !val) return false
      }
    }
    u.isFnc(obj.get) && (result = obj.get(key))
    u.isUnd(result) && (result = get(obj, key))
    u.isUnd(result) && (result = get(obj.blueprint, key))
    return result || defaultValue
  }
  // TODO - Docx files is being detected as PDF -- which prompts downloading
  // TODO - Read possible feat. for viewing docx files https://stackoverflow.com/questions/27957766/how-do-i-render-a-word-document-doc-docx-in-the-browser-using-javascript
  function identifyDoc(obj: CreateDocIdentifierArg) {
    const flags = u.isStr(regexStr) ? 'i' : regexStr.flags
    const regex = u.isStr(regexStr)
      ? new RegExp(regexStr, flags)
      : regexStr.value

    if (regexStr === '') {
      _pick(obj, 'subtype.mediaType') === '' ||
        _pick(obj, 'mediaType') === '' ||
        _pick(obj, 'mimeType') === '' ||
        _pick(obj, 'name.type') === ''
    }

    return !!(
      _pick(obj, 'mimeType', '')?.test?.(regex) ||
      _pick(obj, 'name.type', '')?.test?.(regex) ||
      _pick(obj, 'mediaType', '') == mediaType ||
      _pick(obj, 'subtype.mediaType', '') == mediaType
    )
  }
  return identifyDoc
}

export function _getOrCreateComponentPage(
  componentOrNUIPage: t.NuiComponent.Instance | NUIPage,
  createPage: NDOM['createPage'],
  findPage: NDOM['findPage'],
  node?: any,
) {
  if (_isNUIPage(componentOrNUIPage)) {
    return (findPage(componentOrNUIPage) ||
      // @ts-expect-error
      createPage(componentOrNUIPage, node)) as ComponentPage
  }
  return findPage(componentOrNUIPage) || createPage(componentOrNUIPage, node)
}

export function _isNUIPage(value: unknown): value is NUIPage {
  return !!(value && isNuiPage(value) && !isNDOMPage(value))
}

export function _isPluginComponent(component: t.NuiComponent.Instance) {
  return [
    Identify.component.plugin,
    Identify.component.pluginHead,
    Identify.component.pluginBodyTop,
    Identify.component.pluginBodyTail,
  ].some((fn) => fn(component))
}

export const isImageDoc = _createDocIdentifier(4, 'image')
export const isMarkdownDoc = _createDocIdentifier(8, 'markdown')
export const isNoteDoc = _createDocIdentifier(1, 'json')
export const isPdfDoc = _createDocIdentifier(1, 'pdf')
export const isTextDoc = (obj: Record<string, any>) => {
  const isTxt = (s: string) => (u.isStr(s) && /text/i.test(s)) || s === ''
  if (u.isFnc(obj?.get)) {
    if (obj?.has?.('ecosObj')) {
      const type = get(obj?.get?.('ecosObj'), 'name.type')
      const mediaType = get(obj?.get?.('ecosObj'), 'subtype.mediaType')
      if (u.isStr(type) && isTxt(type)) return true
      if (u.isNum(mediaType) && mediaType === 8) return true
    }
  }
  // Assume plain objects at this point
  if (isTxt(get(obj, 'name.type'))) return true
  return (
    get(obj, 'subtype.mediaType') == 8 ||
    get(obj, 'blueprint.subtype.mediaType') == 8 ||
    get(obj, 'original.subtype.mediaType') == 8
  )
}
export const isWordDoc = _createDocIdentifier(
  1,
  '(office|wordprocessingml|vnl.)',
)

export function _isElemFactory<N extends HTMLElement>(
  arg: string | ((node: HTMLElement) => node is N),
) {
  const pred = u.isStr(arg) ? (node: HTMLElement) => node.tagName === arg : arg
  return (node: HTMLElement): node is N => {
    return node !== null && typeof node === 'object' && pred(node)
  }
}

export const _isButtonEl = _isElemFactory<HTMLButtonElement>('BUTTON')
export const _isDivEl = _isElemFactory<HTMLDivElement>('DIV')
export const _isImageEl = _isElemFactory<HTMLImageElement>('IMG')
export const _isInputEl = _isElemFactory<HTMLInputElement>('INPUT')
export const _isIframeEl = _isElemFactory<HTMLIFrameElement>('IFRAME')
export const _isLinkEl = _isElemFactory<HTMLLinkElement>('LINK')
export const _isListEl = _isElemFactory<HTMLUListElement>('UL')
export const _isScriptEl = _isElemFactory<HTMLScriptElement>('SCRIPT')
export const _isStyleEl = _isElemFactory<HTMLStyleElement>('STYLE')

export const xKeys = ['width', 'left']
export const yKeys = ['height', 'top']
export const posKeys = [...xKeys, ...yKeys]
export const resourceTypes = ['css', 'js'] as const

export function handleDrawGlobalComponent(
  this: NDOM,
  node: HTMLElement,
  component: t.NuiComponent.Instance,
  page: NDOMPage,
) {
  let globalRecord: GlobalComponentRecord
  let globalId = component.get(c.DATA_GLOBALID)

  const attachOnClick = (n: HTMLElement | null, globalId: string) => {
    if (n) {
      const onClick = () => {
        n.removeEventListener('click', onClick)
        this.removeNode(n)
        this.removeGlobalComponent(this.global, globalId)
      }
      n.addEventListener('click', onClick)
    }
  }

  if (this.global.components.has(globalId)) {
    globalRecord = this.global.components.get(globalId) as GlobalComponentRecord
  } else {
    globalRecord = this.createGlobalRecord({
      type: 'component',
      component,
      node,
      page,
    }) as GlobalComponentRecord
    this.global.components.set(globalId, globalRecord)
    globalRecord?.globalId && globalRecord?.globalId !== 'extendView' && attachOnClick(node, globalId)
  }

  if (globalRecord) {
    component.edit({ [c.DATA_GLOBALID]: globalId, globalId })
    if (globalRecord.componentId !== component.id) {
      console.log(
        `%cThe component with id "${component.id || '<Missing ID>'}" ` +
          `is different than the one in the global object.`,
        `color:#CCCD17`,
        globalRecord,
      )
      this.removeComponent(
        cache.component.get(globalRecord.componentId)?.component,
      )
      globalRecord.componentId = component.id
    }

    if (node) {
      !node.id && (node.id = component.id)
      if (globalRecord.nodeId) {
        if (globalRecord.nodeId !== node.id) {
          const _prevNode = document.getElementById(globalRecord.nodeId)
          if (_prevNode) this.removeNode(_prevNode)
          globalRecord.nodeId = node.id
          node.dataset.globalid = globalId
        }
      } else {
        globalRecord.nodeId = node.id
        node.dataset.globalid = globalId
      }
    }

    if (globalRecord.pageId !== page.id) {
      console.log(
        `%cPage ID for global object with id "${component.get(
          c.DATA_GLOBALID,
        )}" does not match with the page that is currently drawing for component "${
          component.id
        }"`,
        `color:#FF5722;`,
        globalRecord,
      )
    }
  }
}

export const _resetActions = u.callAll(
  cache.actions.clear.bind(cache.actions),
  cache.actions.reset.bind(cache.actions),
)

export const _resetComponentCache = cache.component.clear.bind(cache.component)

export const _resetRegisters = cache.register.clear.bind(cache.register)

export const _resetTransactions = cache.transactions.clear.bind(
  cache.transactions,
)

export const _syncPages = (function () {
  const _pageState = new Map<
    number,
    { initiated: boolean; fetching: boolean; initialPageValue: string }
  >()

  const _componentTable = new Map<string, string[]>()
  const _emptyKey_ = '_EMPTY_'
  const _getKey = (pageName = '') => pageName || _emptyKey_

  cache.component
    .on('add', ({ component, page }) => {
      const pageKey = _getKey(page)
      if (!_componentTable.has(pageKey)) _componentTable.set(pageKey, [])
      let ids = _componentTable.get(pageKey) as string[]
      !u.isArr(ids) && (ids = u.array(ids))
      !ids.includes(component.id) && ids.push(component.id)
    })
    .on('remove', ({ id, page }) => {})

  function syncPages(this: NDOM) {
    const initSlice = (page: NUIPage) => ({
      fetching: false,
      initiated: false,
      initialPageValue: page.page,
    })

    const removePage = (page: NUIPage) => {
      const id = page.id || ''
      cache.component.clear(page.page)
      cache.page.remove(page)
      let ndomPage = this.findPage(page)
      if (ndomPage && ndomPage.getNuiPage() === page) {
        ndomPage.remove()
        isComponentPage(ndomPage) && ndomPage.clear()
      }
      id in this.global.pages && delete this.global.pages[id]
    }

    const start = <U extends typeof c.PAGE_CREATED | typeof c.PAGE_REMOVED>(
      updateType: U,
    ) => {
      return (
        args: U extends typeof c.PAGE_CREATED
          ? { component?: t.NuiComponent.Instance; page: NUIPage }
          : NUIPage,
      ) => {
        let page: NUIPage | undefined
        let component: t.NuiComponent.Instance | undefined
        let label = ''

        if (isNuiPage(args)) {
          page = args as NUIPage
        } else if ('page' in args) {
          component = args.component
          page = args.page as NUIPage
        }

        if (page) {
          label = `[${updateType} #${page.id}]`

          page.use({
            onChange: {
              id: 'syncPages',
              fn: (prev: string, next: string) => {
                console.log(`${label} Page changed from "${prev}" to "${next}"`)
              },
            },
          })

          if (updateType === c.PAGE_CREATED) {
            // Incoming page still in the loading state
            // Remove all previous loading pages since we only support 1 loading page right now
            for (const _page of cache.page.get().values()) {
              const nuiPage = _page?.page
              if (
                nuiPage &&
                nuiPage !== page &&
                nuiPage.page === page.page &&
                nuiPage.id !== 'root'
              ) {
                removePage(nuiPage)
              }
            }

            if (!_pageState.has(page.created)) {
              _pageState.set(page.created, initSlice(page))
            }

            let ndomPage = this.findPage(page)
            let stateSlice = _pageState.get(page.created) || initSlice(page)

            if (!ndomPage) {
              if (component) ndomPage = this.createPage(component)
              else {
                if (page.id) {
                  const pageComponent = this.cache.component?.get?.(
                    page.id as string,
                  )?.component

                  if (pageComponent) {
                    if (pageComponent.get('page') !== page) {
                      pageComponent.edit('page', page)
                    }
                    ndomPage = this.createPage(pageComponent) as NDOMPage
                  }
                }

                !ndomPage && (ndomPage = this.createPage(page))
              }
            }

            if (
              // @ts-expect-error
              !this.global.pageIds.includes(ndomPage.id)
            ) {
              this.global.add(ndomPage)
            }

            if (isComponentPage(ndomPage)) {
              stateSlice.initiated = !!ndomPage.initialized
            }
          } else if (updateType === c.PAGE_REMOVED) {
            _pageState.delete(page.created)
          }
        }
      }
    }

    cache.page
      .on(c.PAGE_CREATED, start(c.PAGE_CREATED))
      .on(c.PAGE_REMOVED, start(c.PAGE_REMOVED))

    const updateFetching = curry((fetchValue: boolean, page: NUIPage) => {
      if (!page?.created) return null
      if (_pageState.has(page.created)) {
        const stateSlice = _pageState.get(page.created)
        stateSlice && (stateSlice.fetching = fetchValue)
      }
    })

    this.on('onBeforeRequestPageObject', updateFetching(true))
    this.on('onAfterRequestPageObject', updateFetching(false))
  }

  syncPages._pageState = _pageState
  return syncPages
})()

/**
 * Normalizes the queried nodes to an HTMLElement or an array of HTMLElement
 * @param { NodeList | HTMLCollection | HTMLElement } nodes
 */
export function asHtmlElement(nodes: t.DOMNodeInput) {
  if (nodes instanceof NodeList || nodes instanceof HTMLCollection) {
    if (nodes.length === 0) return null
    if (nodes.length === 1) return nodes.item(0) as HTMLElement
    const results = [] as HTMLElement[]
    for (const node of nodes) results.push(node as HTMLElement)
    return results
  }
  return nodes || null
}

/**
 * Returns the DOM element tag name for the NOODL component
 * @param { t.NuiComponent.Instance | NuiComponentType } component
 */
export function getElementTag(
  component: t.NuiComponent.Instance | t.NuiComponentType | undefined,
): keyof HTMLElementTagNameMap {
  const componentType = u.isStr(component) ? component : component?.type || ''
  const tagName = getElementTag.prototype.elementMap[componentType]

  if (!tagName) {
    let msg = ``
    if (!componentType) {
      msg += `Received an empty component type. The element tag will default to a "div"`
    } else {
      msg += `None of the node types matched with "${componentType}". Perhaps it needs to be ' +
      'supported? (Defaulting to "div" instead)`
    }
    console.log(`%c${msg}`, 'color:#e74c3c;font-weight:bold;', {
      component,
      componentType,
      elementMap: getElementTag.prototype.elementMap,
    })
    return 'div'
  }

  return tagName
}

getElementTag.prototype.elementMap = {
  span: 'span',
  br: 'br',
  button: 'button',
  canvas: 'canvas',
  chart: 'div',
  date: 'input',
  dateSelect: 'input',
  divider: 'hr',
  ecosDoc: 'div',
  footer: 'div',
  header: 'div',
  searchBar: 'input',
  textField: 'input',
  image: 'img',
  label: 'div',
  list: 'ul',
  listItem: 'li',
  map: 'div',
  page: 'iframe',
  popUp: 'div',
  plugin: 'div',
  pluginHead: 'script',
  pluginBodyTail: 'script',
  register: 'div',
  scrollView: 'div',
  select: 'select',
  textView: 'textarea',
  video: 'video',
  view: 'div',
} as const

/**
 * Creates a function that queries for a DOM node.
 * This method searches through several window/document objects and is most
 * useful for page consumer components
 * @param { string } attr
 */
export function makeFindByAttr(attr: LiteralUnion<t.DataAttribute, string>) {
  const findByAttr = function findByAttr(
    component?: t.NuiComponent.Instance | LiteralUnion<t.DataAttribute, string>,
  ) {
    if (component === undefined) return findBySelector(`[${attr}]`)
    else if (!component) return null
    return c.lib.dataAttributes.includes(attr as t.DataAttribute)
      ? findByDataAttrib(
          attr,
          isComponent(component)
            ? pullFromComponent(attr, component)
            : component,
        )
      : findBySelector(`[${attr}]`)
  }

  return findByAttr
}

export function findBySelector<T extends string>(
  selector: LiteralUnion<T, string>,
): OrArray<t.NDOMElement<T> | HTMLElement> | null {
  const mapper = {
    button: 'button',
    canvas: 'canvas',
    chart: '.chart',
    chatList: 'ul',
    divider: 'hr',
    ecosDoc: '.ecosDoc',
    footer: '.footer',
    header: '.header',
    label: '.label',
    map: '.map',
    page: '.page',
    plugin: '.plugin',
    pluginHead: '.plugin-head',
    pluginBodyTop: '.plugin-body-top',
    pluginBodyTail: '.plugin-body-bottom',
    popUp: '.popUp',
    image: 'img',
    textField: 'input',
    list: 'ul',
    listItem: 'li',
    select: 'select',
    textView: 'textarea',
    video: 'video',
  } as const

  return selector
    ? findElement((doc) => {
        const nodes = doc?.querySelectorAll?.(
          mapper[selector as keyof typeof mapper] || selector,
        )
        if (nodes?.length) return nodes
        return null
      })
    : null
}

export function findByDataAttrib(
  dataAttrib: LiteralUnion<t.DataAttribute, string> | undefined,
  value?: string,
) {
  return findBySelector(
    value ? `[${dataAttrib}="${value}"]` : `[${dataAttrib}]`,
  )
}
export const findByDataKey = makeFindByAttr('data-key')
export const findByGlobalId = makeFindByAttr('data-globalid')
export const findByPlaceholder = makeFindByAttr('data-placeholder')
export const findBySrc = makeFindByAttr('data-src')
export const findByViewTag = makeFindByAttr('data-viewtag')
export const findByUX = makeFindByAttr('data-ux')
export const findByDataOpton = makeFindByAttr('data-option')


export function findByClassName(className: string | undefined) {
  return findElement((doc) =>
    doc?.getElementsByClassName(u.isStr(className) ? className : ''),
  )
}

export function findByElementId(
  c: t.NuiComponent.Instance | string | undefined,
) {
  return findElement((doc) => doc?.getElementById(u.isStr(c) ? c : c?.id || ''))
}

export interface FindFunc<Arg = any> {
  (document: Document, arg: Arg): HTMLElement | null
}

export function makeFindFirstBy<Arg = any>(
  fn: FindFunc<Arg>,
): (arg: Arg) => HTMLElement {
  return function (arg) {
    return u.filter(
      Boolean,
      u.array(findElement((doc) => doc && fn(doc, arg))),
    )[0] as HTMLElement
  }
}

export const findFirstBySelector = makeFindFirstBy<string>((doc, selector) =>
  doc.querySelector(selector),
)

export const findFirstByDataKey = makeFindFirstBy<string>((doc, dataKey) =>
  doc.querySelector(`[data-key="${dataKey}"]`),
)

export const findFirstByGlobalId = makeFindFirstBy<string>((doc, globalId) =>
  doc.querySelector(`[data-globalid="${globalId}"]`),
)

export const findFirstByViewTag = makeFindFirstBy<string>((doc, viewTag) =>
  doc.querySelector(`[data-viewtag="${viewTag}"]`),
)
export const findFirstByDataOption = makeFindFirstBy<string>((doc, dataOption) =>
  doc.querySelector(`[data-option="${dataOption}"]`),
)
export const findFirstByVideoOption = makeFindFirstBy<string>((doc, videoOption) =>
  doc.querySelector(`[video-option="${videoOption}"]`),
)
export const findFirstByElementId = makeFindFirstBy<
  t.NuiComponent.Instance | string
>((doc, c) => doc.getElementById(u.isStr(c) ? c : c?.id))

export const findFirstByClassName = makeFindFirstBy<string>(
  (doc, className) => doc.getElementsByClassName(className)?.[0] as HTMLElement,
)

/**
 * Returns the component instance of type: page if it exists in the parent ancestry tree
 * @param { t.NuiComponent.Instance } component
 */
export function getPageAncestor(
  component: t.NuiComponent.Instance | null | undefined,
) {
  if (isComponent(component)) {
    if (component.type === 'page') return component
    return findParent(component, is.component.page)
  }
  return null
}

/**
 * Returns the index from the parent's children.
 * Returns -1 if it the node is not a child of the parent
 * @param node
 * @returns { number }
 */
export function getNodeIndex<N extends t.NDOMElement>(
  node: N | null | undefined,
) {
  if (node?.parentElement || node?.parentNode) {
    if (node.childElementCount === 1) return 0
    if (node.childElementCount > 1) {
      return [...node.children].findIndex((n) => n === node)
    }
  }
  return -1
}

export function makeElemFn(fn: (node: HTMLElement) => void) {
  const onNodes = function _onNodes(nodes: t.DOMNodeInput, cb?: typeof fn) {
    let count = 0
    u.array(asHtmlElement(nodes)).forEach((node) => {
      if (node) {
        count++
        fn(node)
        cb?.(node)
      }
    })
    return count || false
  }
  return onNodes
}

/**
 * Returns true if the value can be displayed in the UI as normal.
 * A displayable value is any value that is a string or number
 * @param { any } value
 */
export function isDisplayable(value: unknown): value is string | number {
  return value == 0 || u.isStr(value) || u.isNum(value)
}

/**
 * Returns true if the component is a descendant of a component of type: "page"
 * @param { t.NuiComponent.Instance } component
 */
export function isPageConsumer(component: any): boolean {
  return isComponent(component)
    ? !!findParent(component, (parent) => parent?.type === 'page')
    : false
}

export function normalizeEventName(eventName: string) {
  return u.isStr(eventName)
    ? eventName.startsWith('on')
      ? eventName.replace('on', '').toLowerCase()
      : eventName.toLowerCase()
    : eventName
}

/**
 * Simulates a user-click and opens the link in a new tab.
 * @param { string } url - An outside link
 */
export function openOutboundURL(url: string) {
  if (typeof window !== 'undefined') {
    window.location.href = url
  }
}

export function isTextFieldLike(
  node: unknown,
): node is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return !!(
    node &&
    node instanceof HTMLElement &&
    (node.tagName === 'INPUT' ||
      node.tagName === 'SELECT' ||
      node.tagName === 'TEXTAREA')
  )
}

export function toSelectOption(value: any): t.SelectOption {
  if (!u.isObj(value)) {
    return { key: value, label: value, value }
  }
  return value as t.SelectOption
}

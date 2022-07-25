import * as u from '@jsmanifest/utils'
import { isActionChain } from 'noodl-action-chain'
import { createEmitDataKey } from 'noodl-utils'
import { Identify } from 'noodl-types'
import has from 'lodash/has'
import type SignaturePad from 'signature_pad'
import type { ComponentObject } from 'noodl-types'
import {
  _getOrCreateComponentPage,
  _isDivEl,
  _isPluginComponent,
  findFirstByElementId,
  isImageDoc,
  isMarkdownDoc,
  isTextDoc,
  isWordDoc,
  toSelectOption,
} from '../utils'
import createEcosDocElement from '../../utils/createEcosDocElement'
import applyStyles from '../../utils/applyStyles'
import copyStyles from '../../utils/copyStyles'
import cache from '../../_cache'
import EmitAction from '../../actions/EmitAction'
import { formatColor } from '../../utils/common'
import isComponent from '../../utils/isComponent'
import { publish } from '../../utils/noodl'
import type NDOM from '../noodl-ui-dom'
import type NDOMPage from '../Page'
import type { ComponentPage } from '../factory/componentFactory'
import { _isLinkEl, _isIframeEl, _isScriptEl, _isStyleEl } from '../utils'
import * as t from '../../types'
import * as c from '../../constants'

const componentsResolver: t.Resolve.Config = {
  name: `[noodl-ui-dom] components`,
  async before(args) {
    try {
      if (
        Identify.component.page(args.component) &&
        args.component.get('page')
      ) {
        const componentPage = args.findPage(
          args.component.get('page'),
        ) as ComponentPage
        if (componentPage) {
          if (componentPage.node !== args.node) {
            // TODO - Do we need this?
            const currentStyles = copyStyles(args.node)
            componentPage.replaceNode(args.node as HTMLIFrameElement)
            args.node = componentPage.node
            args.node.style.width = 'inherit'
            args.node.style.height = 'inherit'
            // TODO - Do we need this?
            applyStyles(args.node, currentStyles)
          }
        }
      }
    } catch (error) {
      console.error(error)
      // @ts-expect-error
      throw new Error(error)
    }
  },
  async resolve(args) {
    try {
      const { nui, renderPage, setAttr, setDataAttr, setStyleAttr } = args

      if (u.isFnc(args.node)) {
        // PLUGIN
        if (_isPluginComponent(args.component)) {
          let path = (args.component.get('path') ||
            args.component.blueprint.path) as string
          let plugin = args.component.get('plugin') as t.Plugin.Object
          let tagName = '' // 'div', etc
          let type = '' // text/html, etc

          if (path.endsWith('.css')) {
            type = 'text/css'
            tagName = 'style'
          } else if (path.endsWith('.html')) {
            tagName = 'iframe'
          } else if (path.endsWith('.js')) {
            type = 'text/javascript'
            tagName = 'script'
          } else {
            type = 'text/plain'
            tagName = 'script'
          }

          let pluginNode = getPluginElem(tagName) as any
          // If the node is a function then it is expecting us to decide what node to use
          u.isFnc(args.node) && args.node(pluginNode)

          function getPluginElem(tagName: 'link'): HTMLLinkElement
          function getPluginElem(tagName: 'script'): HTMLScriptElement
          function getPluginElem(tagName: 'style'): HTMLStyleElement
          function getPluginElem(tagName: 'iframe'): HTMLIFrameElement
          function getPluginElem(tagName: string): HTMLElement | null
          function getPluginElem<T extends string>(tagName: T) {
            switch (tagName as T) {
              case 'link': {
                const node = document.createElement('link')
                node.rel = 'stylesheet'
                return node
              }
              case 'iframe':
                return document.createElement('div')
              case 'script':
                return document.createElement('script')
              case 'style':
                return document.createElement('style')
              default:
                return null
            }
          }

          function loadAttribs(
            component: t.NuiComponent.Instance,
            elem: HTMLLinkElement | null,
            data: any,
          ): HTMLLinkElement
          function loadAttribs(
            component: t.NuiComponent.Instance,
            elem: HTMLScriptElement | null,
            data: any,
          ): HTMLScriptElement
          function loadAttribs(
            component: t.NuiComponent.Instance,
            elem: HTMLStyleElement | null,
            data: any,
          ): HTMLStyleElement
          function loadAttribs(
            component: t.NuiComponent.Instance,
            elem: HTMLIFrameElement | null,
            data: any,
          ): HTMLIFrameElement
          function loadAttribs<
            N extends
              | HTMLIFrameElement
              | HTMLLinkElement
              | HTMLScriptElement
              | HTMLStyleElement,
          >(component: t.NuiComponent.Instance, elem: N | null, data: any) {
            if (!elem) return elem
            elem.id = component.id
            if (_isLinkEl(elem)) {
              elem.innerHTML = String(data)
              elem.rel = 'stylesheet'
            } else if (_isScriptEl(elem)) {
              elem.innerHTML = String(data)
              elem.type = type
              // eval(data)
            } else if (_isStyleEl(elem)) {
              elem.innerHTML = String(data)
            } else if (_isIframeEl(elem)) {
              const parentNode =
                elem.parentNode || args.page.node || document.body
              elem.innerHTML += data
              if (parentNode.children.length) {
                parentNode.insertBefore(elem, parentNode.childNodes[0])
              } else {
                parentNode.appendChild(elem)
              }
            }
            return elem
          }

          if (args.component.has('content')) {
            loadAttribs(
              args.component,
              pluginNode,
              args.component.get('content'),
            )
          }

          args.component.on(
            'content',
            (content: string) =>
              loadAttribs(args.component, pluginNode, content),
            'content',
          )

          try {
            if (pluginNode) {
              const insert = (
                node: HTMLElement | null,
                location: t.Plugin.Location | undefined,
              ) => {
                const appendChild = (
                  page: NDOMPage,
                  childNode: HTMLElement,
                  top = true,
                ) => {
                  const parentNode = node || page.node || document.body

                  if (top) {
                    if (parentNode.children.length) {
                      parentNode.insertBefore(
                        childNode,
                        parentNode.childNodes[0],
                      )
                    } else parentNode.appendChild(childNode)
                  } else parentNode.appendChild(childNode)
                }

                if (node) {
                  if (_isIframeEl(node) || _isDivEl(node))
                    appendChild(args.page, node)
                  else if (_isLinkEl(node)) {
                    if (_isIframeEl(args.page.node)) {
                      args.page.node.contentDocument?.head.appendChild(node)
                    } else {
                      document.head.appendChild(node)
                    }
                  } else if (_isScriptEl(node)) {
                    appendChild(args.page, node, location === 'body-bottom')
                  }
                }
              }
              insert(pluginNode, args.component.get('plugin')?.location)
            }
          } catch (error) {
            console.error(error)
          }

          return pluginNode
        }
      } else if (args.node) {
        const original = args.component.blueprint || {}

        const {
          children,
          controls,
          dataKey,
          autoplay,
          onClick,
          options: selectOptions,
          poster,
          text,
          videoType,
        } = original

        // BUTTON
        if (Identify.component.button(args.component)) {
          if (args.node) {
            if (args.component.get(c.DATA_SRC)) {
              u.forEach(
                ([k, v]) => setStyleAttr(k as any, v),
                [
                  ['overflow', 'hidden'],
                  ['display', 'flex'],
                  ['alignItems', 'center'],
                ],
              )
            }
            setStyleAttr('cursor', onClick ? 'pointer' : 'auto')
          }
        }
        // CANVAS
        else if (Identify.component.canvas(args.component)) {
          const _dataKey = (args.component.get(c.DATA_KEY) || dataKey) as string

          if (_dataKey) {
            const signaturePad = args.component.get(
              'signaturePad',
            ) as SignaturePad

            if (signaturePad) {
              signaturePad.onEnd = () => {
                const dataUrl = signaturePad.toDataURL()
                const mimeType = dataUrl.split(';')[0].split(':')[1] || ''
                ;(args.node as HTMLCanvasElement).toBlob(
                  (blob) => {
                    if (nui) {
                      // TEMP - Remove this when "isRootDataKey" is not giving the "not a function" error
                      function isRootDataKey(dataKey: string | undefined) {
                        if (typeof dataKey === 'string') {
                          if (dataKey.startsWith('.')) {
                            dataKey = dataKey
                              .substring(dataKey.search(/[a-zA-Z]/))
                              .trim()
                          }
                          if (!/^[a-zA-Z]/i.test(dataKey)) return false
                          if (dataKey)
                            return dataKey[0].toUpperCase() === dataKey[0]
                        }
                        return false
                      }

                      let dataObject = isRootDataKey(_dataKey)
                        ? nui.getRoot()
                        : nui.getRoot()?.[args.page?.page || '']
                      if (has(dataObject, _dataKey)) {
                        // set(dataObject, dataKey, blob)
                      } else {
                        console.log(
                          `%cTried to set a signature blob using path "${_dataKey}" ` +
                            `but it was not found in the root or local root object. ` +
                            `It will be created now.`,
                          `color:#ec0000;`,
                          {
                            blob,
                            currentPage: args?.page?.page,
                            node: args.node,
                            root: nui.getRoot(),
                          },
                        )
                      }
                    } else {
                      console.log(
                        `%c"nui" is missing in the "components" DOM resolver`,
                        `color:#ec0000;`,
                        this,
                      )
                    }
                  },
                  mimeType,
                  8,
                )
              }
            } else {
              console.log(
                `%cSignature pad is missing from a canvas component!`,
                `color:#ec0000;`,
                args,
              )
            }
          } else {
            console.log(
              `%cInvalid data key "${dataKey}" for a canvas component. ` +
                `There may be unexpected behavior`,
              `color:#ec0000;`,
              args,
            )
          }
        }
        // ECOSDOC
        else if (Identify.component.ecosDoc(args.component)) {
          const idLabel =
            (isImageDoc(args.component) && 'image') ||
            (isMarkdownDoc(args.component) && 'markdown') ||
            (Identify.ecosObj.doc(args.component) && 'doc') ||
            (isTextDoc(args.component) && 'text') ||
            (isWordDoc(args.component) && 'word-doc') ||
            'ecos'

          let iframe: HTMLIFrameElement | undefined

          try {
            const loadResult = await createEcosDocElement(
              args.node as HTMLElement,
              args.component.get('ecosObj') ||
                args.component?.blueprint?.['ecosObj'],
            )
            iframe = loadResult.iframe
          } catch (error) {
            console.error(error)
            iframe = document.createElement('iframe')
          }

          iframe && (iframe.id = `${idLabel}-document-${args.component.id}`)
          iframe.onerror = (evt) =>
            console.error(`[ERROR]: In ecosDoc component: ${evt}`, evt)

          args.node?.appendChild(iframe)
        }
        // IMAGE
        else if (Identify.component.image(args.component)) {
          if (args.node) {
            if (onClick) setStyleAttr('cursor', 'pointer')
            // If an image has children, we will assume it is some icon button overlapping
            //    Ex: profile photos and showing pencil icon on top to change it
            if (children) {
              setStyleAttr('width', '100%')
              setStyleAttr('height', '100%')
            }
          }
          if (args.component.get(c.DATA_SRC)) {
            setAttr('src', args.component.get(c.DATA_SRC))
            setDataAttr('src', args.component.get(c.DATA_SRC))
          } else {
          }
          args.component.on('path', (result: string) => {
            if (args.node) {
              setAttr('src', result)
              setDataAttr('src', result)
            }
          })

          // load promise return to image
          if (args.component.blueprint?.['path=func']) {
            // ;(node as HTMLImageElement).src = '../waiting.png'
            const result = args.component?.get?.(c.DATA_VALUE)
            if(result?.then){
              result.then?.((path: any) => {
                if (!path) {
                  console.log(
                    `%cReceived an empty value from "path=func"! An empty string will be set as the image's "src" attribute`,
                    `color:#ec0000;`,
                    args.component,
                  )
                }

                if (path && path?.url) {
                  if (path?.type && path.type == 'application/pdf') {
                    //pdf preview
                    let key
                    let iframe = document.createElement('iframe')
                    iframe.src = `${path.url}#toolbar=0&navpanes=0&scrollbar=0`
                    iframe.style.border = 'none'
                    for (let i = 0; i < args.node.style.length; i++) {
                      key = args.node.style[i]
                      iframe.style[key] = args.node.style[key]
                    }
                    let parent = args.node.parentNode
                    parent?.appendChild(iframe)
                    parent?.removeChild(args.node)
                  } else {
                    console.log('load path', path)
                    setAttr('src', path?.url)
                  }
                } else {
                  if (!args.component?.get?.(c.DATA_SRC)) return
                  setAttr('src', args.component?.get?.(c.DATA_SRC) || '')
                }
              })
              .catch((error: any) => {
                console.log(error)
                if (!args.component?.get?.(c.DATA_SRC)) return
                setAttr('src', args.component?.get?.(c.DATA_SRC) || '')
              })
            }else if(args.component.get('wait')){
              setAttr('src', result?.url)
            }
          }
        }
        // LABEL
        else if (Identify.component.label(args.component)) {
          if (args.node) {
            if (args.component.get(c.DATA_VALUE)) {
              const datavalue = args.component.get(c.DATA_VALUE)
              if(typeof(datavalue.then) === 'function'){
                datavalue.then?.((content: string) => {
                  content =
                    content.indexOf('\n') !== -1
                      ? content.replace(/\n/g, '<br>')
                      : content
                  setAttr('innerHTML', content)
                })
              }else{
                let content = String(datavalue)
                content =
                  content.indexOf('\n') !== -1
                    ? content.replace(/\n/g, '<br>')
                    : content
                setAttr('innerHTML', content)
              }
            } else if (text) {
              setAttr('innerHTML', String(text))
            } else if (args.component.get(c.DATA_PLACEHOLDER)) {
              setAttr(
                'innerHTML',
                String(args.component.get(c.DATA_PLACEHOLDER)),
              )
            }
            onClick && setStyleAttr('cursor', 'pointer')
          }
        }
        // LIST
        else if (Identify.component.listLike(args.component)) {
          //
        }
        // PAGE
        else if (Identify.component.page(args.component)) {
          if (u.isStr(args.component.get('path'))) {
            const componentPage = _getOrCreateComponentPage(
              args.component,
              args.createPage,
              args.findPage,
              args.node,
            )

            if (_isIframeEl(args.node)) {
              const nuiPage =
                args.component.get('page') ||
                cache.page.get(args.component.id)?.page
              const src = nuiPage?.page
              if (componentPage.remote) {
                /**
                 * Page components loading content through remote URLs
                 * (https links or anything that is an html file)
                 */
                componentPage.on(
                  c.eventId.componentPage.on.ON_MESSAGE,
                  async (dataObject: Record<string, any>) => {
                    if (isActionChain(args.component.get('postMessage'))) {
                      const actionChain = args.component.get(
                        'postMessage',
                      ) as t.NUIActionChain

                      const postMessageAction = actionChain.queue.find(
                        (action) => action.trigger === 'postMessage',
                      ) as EmitAction

                      if (postMessageAction) {
                        postMessageAction.dataKey = createEmitDataKey(
                          postMessageAction.original?.emit?.dataKey,
                          dataObject,
                        )
                      } else {
                        console.log(
                          `%cCould not find a postMessage emit action inside a postMessage action chain`,
                          `color:#ec0000;`,
                          { ...args, dataObject },
                        )
                      }

                      // TODO - Migrate all actions to use this way of working with their data objects
                      // actionChain.data.set('dataObject', dataObject)
                      await actionChain.execute()
                    } else {
                      console.log(
                        `%cReceived a message from a child of a page component and expected an action chain but received "${typeof args.component.get(
                          'postMessage',
                        )}"`,
                        `color:#ec0000;`,
                        { ...args, dataObject },
                      )
                    }
                  },
                )

                function onLoad(opts: {
                  event?: Event
                  node: t.NDOMElement<'page'>
                  component: t.NuiComponent.Instance
                  createPage: NDOM['createPage']
                  findPage: NDOM['findPage']
                  resolvers: NDOM['resolvers']
                }) {
                  let src = opts.component.get('page')?.page || ''
                  let componentPage = _getOrCreateComponentPage(
                    args.component,
                    args.createPage,
                    args.findPage,
                    args.node,
                  )
                  if (
                    componentPage.id !== 'root' &&
                    componentPage.node !== opts.node
                  ) {
                    try {
                      componentPage.replaceNode(opts.node)
                    } catch (error) {
                      console.error(error)
                    }
                  }

                  src && opts.node.src !== src && (opts.node.src = src)
                }

                if (src) {
                  onLoad({
                    component: args.component,
                    createPage: args.createPage,
                    findPage: args.findPage,
                    node: args.node,
                    resolvers: args.resolvers,
                  })
                } else {
                  componentPage.window.onload = (evt) =>
                    onLoad({
                      event: evt,
                      createPage: args.createPage,
                      component: args.component,
                      node: args.node as HTMLIFrameElement,
                      findPage: args.findPage,
                      resolvers: args.resolvers,
                    })
                }

                // args.node.src = args.component.get('page')?.page || ''
                componentPage.node.onload = console.error
              } else {
                /**
                 * If this page component is not remote, it is loading a page
                 * from the "page" list from a noodl app config
                 */
                async function onPageComponents() {
                  try {
                    const componentPage = _getOrCreateComponentPage(
                      args.component,
                      args.createPage,
                      args.findPage,
                      args.node,
                    )

                    if (componentPage) {
                      const nuiPage = args.cache.page.get(
                        componentPage.id as string,
                      )?.page
                      if (nuiPage) {
                        if (
                          isComponent(args.component) &&
                          isComponent(componentPage.component) &&
                          args.component !== componentPage.component
                        ) {
                          console.log(
                            `Incoming component is not the same as current component. Patching now`,
                          )
                          componentPage.patch(args.component)
                        }

                        if (!componentPage.hasNuiPage && nuiPage) {
                          console.log(
                            `ComponentPage does not have a nuiPage. Patching now with a new one`,
                          )
                          componentPage.patch(nuiPage)
                        } else if (
                          nuiPage &&
                          nuiPage !== componentPage.getNuiPage()
                        ) {
                          console.log(
                            `The nuiPage in the ComponentPage is different than the incoming one. Patching with the incoming one now`,
                            nuiPage,
                          )
                          componentPage.patch(nuiPage)
                        }
                      } else {
                        console.info(`nuiPage does not exist in the PageCache`)
                      }

                      const pageName =
                        componentPage.requesting || componentPage.page

                      if (
                        u.isStr(componentPage.id) &&
                        componentPage.id in args.renderState.draw.loading
                      ) {
                        const renderState =
                          args.renderState.draw.loading[componentPage.id]
                        if (renderState) return args.node
                      }

                      if (nui.getPages().includes(pageName)) {
                        await args.transact(
                          'REQUEST_PAGE_OBJECT',
                          componentPage,
                        )
                      }
                    } else {
                      console.log(
                        `ComponentPage is null or undefined inside onPageComponents`,
                      )
                    }

                    /** Initiation / first time rendering */
                    if (!componentPage.initialized) {
                      componentPage.initialized = true
                    }

                    /**
                     * Clean up inactive components if any remain from
                     * previous renders
                     */
                    if (componentPage.requesting) {
                      // args.cache.component.clear(componentPage.page)
                      args.cache.component.clear(componentPage.requesting)
                    }

                    //Ensure that the margin of the body is 0
                    if (args.node) {
                      const iframe = args.node as HTMLIFrameElement
                      const iwindow = iframe.contentWindow
                      if (iwindow) {
                        const idoc = iwindow.document
                        idoc?.body?.style && (idoc.body.style.margin = '0px')
                      }
                    }

                    if (componentPage?.component) {
                      const getDescendantIds = (
                        component: t.NuiComponent.Instance,
                      ): string[] => {
                        const ids = [] as string[]
                        publish(component, (child) => ids.push(child.id))
                        return ids
                      }

                      const descendentIds = getDescendantIds(
                        componentPage.component,
                      )
                      for (const id of descendentIds) {
                        args.cache.component.remove(id)
                        findFirstByElementId?.(id)?.remove?.()
                      }
                    }

                    args.component.clear('children')
                    componentPage.component?.clear?.('children')

                    // const cs = []
                    await Promise.all(
                      componentPage.components?.map(
                        async (obj: ComponentObject) => {
                          return new Promise(async (resolve) => {
                            let child = await nui.resolveComponents({
                              components: obj,
                              page: nuiPage,
                              on: args.on,
                            })

                            // TODO - We might not need this line
                            args.component.createChild(child)

                            if (componentPage.body == null) {
                              componentPage.on('ON_LOAD', async () => {
                                let childNode = await args.draw(
                                  child,
                                  componentPage.body,
                                  componentPage,
                                  { on: args.on },
                                )
                                childNode &&
                                  componentPage.appendChild(childNode)
                                resolve(child)
                              })
                            } else {
                              let childNode = await args.draw(
                                child,
                                componentPage.body,
                                componentPage,
                                { on: args.on },
                              )
                              childNode && componentPage.appendChild(childNode)
                              resolve(child)
                            }
                          })
                        },
                      ) || [],
                    )
                  } catch (error) {
                    console.error(error)
                  }
                }

                args.node.onload = onPageComponents
                args.component
                  .get?.('page')
                  ?.on?.('PAGE_CHANGED', onPageComponents)
              }
            } else {
              console.log(
                `%cEncountered a page component with a node that is not an iframe. This is not supported yet`,
                `color:#FF5722;`,
                args,
              )
            }
          } else {
            console.log(
              `%cA page component did not receive its NUIPage instance`,
              `color:#ec0000;`,
              args,
            )
          }
        }
        // SELECT
        else if (Identify.component.select(original)) {
          let dataKey = original.dataKey
          if (args.component.get('size')) {
            const size = args.component.get('size')
            const select = args.node as HTMLTextAreaElement
            let height = args.component?.style?.height
            const initHeight =
              typeof height == 'string'
                ? parseFloat(height.replace('px', ''))
                : height
            const sizeHeight =
              typeof initHeight == 'number' ? initHeight * size : 0
            select.onmouseup = function () {
              select.setAttribute('size', size)
              select.style.height = sizeHeight + 'px'
            }
            select.onblur = function () {
              select.removeAttribute('size')
              select.style.height = initHeight + 'px'
            }
            select.onchange = function () {
              select.removeAttribute('size')
              select.style.height = initHeight + 'px'
            }
          }
          function clearOptions(_node: HTMLSelectElement) {
            const numOptions = _node.options
            for (let index = 0; index < numOptions.length; index++) {
              const option = _node.options[index]
              option.remove()
            }
            _node.options.length = 0
          }

          function setSelectOptions(_node: HTMLSelectElement, opts: any[]) {
            u.array(opts).forEach((option: t.SelectOption, index) => {
              option = toSelectOption(option)
              const optionNode = document.createElement('option')
              _node.appendChild(optionNode)
              optionNode.id = option.key
              optionNode.value = option.value
              optionNode.textContent = option.label
              if (
                option?.value === args.component.props[c.DATA_VALUE]?.toString()
              ) {
                // Default to the selected index if the user already has a state set before
                _node.selectedIndex = index
                _node.dataset.value = option.value
                _node.value = option.value
              }
            })
          }

          clearOptions(args.node as HTMLSelectElement)

          if (
            u.isArr(selectOptions) &&
            args.component.get(c.DATA_VALUE) == undefined
          ) {
            setSelectOptions(args.node as HTMLSelectElement, selectOptions)
          } else if (u.isStr(selectOptions) || (dataKey && u.isStr(dataKey))) {
            // Retrieved through reference
          }

          args.component.on('options', (dataOptions: any[]) => {
            // clearOptions(args.node as HTMLSelectElement)
            clearOptions(args.node as HTMLSelectElement)
            setSelectOptions(args.node as HTMLSelectElement, dataOptions)
          })

          // Default to the first item if the user did not previously set their state
          if (
            args.component.get(c.DATA_VALUE) != undefined &&
            u.isArr(selectOptions)
          ) {
            const index = selectOptions.indexOf(
              args.component.get(c.DATA_VALUE),
            )
            if (
              index !== -1 &&
              (args.node as HTMLSelectElement).selectedIndex !== index
            ) {
              ;(args.node as HTMLSelectElement).selectedIndex = index
            }
          } else if ((args.node as HTMLSelectElement)?.selectedIndex === -1) {
            ;(args.node as HTMLSelectElement).selectedIndex = 0
          }
        } else if (Identify.textBoard(original)) {
          const { textBoard, text } = args.component.props
          if (u.isArr(args.component)) {
            if (u.isArr(textBoard)) {
              if (u.isStr(text)) {
                console.log(
                  `%cA component cannot have a "text" and "textBoard" property ` +
                    `because they both overlap. The "text" will take precedence.`,
                  `color:#ec0000;`,
                  args.component.toJSON(),
                )
              }

              textBoard.forEach((item) => {
                if (Identify.textBoardItem(item)) {
                  const br = args.nui.createComponent(
                    'view',
                    args.page.getNuiPage(),
                  )
                  args.component.createChild(br as any)
                } else {
                  /**
                   * NOTE: Normally in the return type we would return the child
                   * component wrapped with a resolveComponent call but it is conflicting
                   * with our custom implementation because its being assigned unwanted style
                   * attributes like "position: absolute" which disrupts the text display.
                   * TODO: Instead of a resolverComponent, we should make a resolveStyles
                   * to get around this issue. For now we'll hard code known props like "color"
                   */
                  const text = args.nui.createComponent(
                    {
                      type: 'label',
                      style: {
                        display: 'inline-block',
                        ...(item.color
                          ? { color: formatColor(item.color) }
                          : undefined),
                      },
                      text: item.text,
                    },
                    args.page.getNuiPage(),
                  )
                  args.component.createChild(text as any)
                }
              })
            } else {
              console.log(
                `%cExpected textBoard to be an array but received "${typeof textBoard}". ` +
                  `This part of the component will not be included in the output`,
                `color:#ec0000;`,
                { component: args.component.toJSON(), textBoard },
              )
            }
          }
        }
        /* -------------------------------------------------------
          ---- DISABLING / ENABLING
        -------------------------------------------------------- */
        // TEXTVIEW
        else if (Identify.component.textView(args.component)) {
          if (args.component.has('isEditable')) {
            const isEditable = args.component.get('isEditable')
            const isDisabled = Identify.isBooleanFalse(isEditable)
            if (isDisabled) {
              setAttr('disabled', isDisabled)
            }
          }
          args.node?.addEventListener(
            'change',
            function (this: HTMLTextAreaElement) {
              this.dataset.value = this.value
              args.component.edit(c.DATA_VALUE, this.value)
              args.component.emit(c.DATA_VALUE, this.value)
            },
          )
        }
        // textField
        else if (Identify.component.textField(args.component)) {
          if (args.component.has('isEditable')) {
            const isEditable = args.component.get('isEditable')
            // console.log(maxLen,"nnnnn")
            const isDisabled = Identify.isBooleanFalse(isEditable)
            if (isDisabled) {
              setAttr('disabled', isDisabled)
            }
            // if (maxLen) {
            //   setAttr('maxLength', maxLen)
            // }
          }
          if (args.component.blueprint?.autocomplete) {
            const autocomplete = args.component.get('autocomplete')
            setAttr('autocomplete', autocomplete)
          }
          args.node?.addEventListener(
            'change',
            function (this: HTMLInputElement) {
              this.dataset.value = this.value
              args.component.edit(c.DATA_VALUE, this.value)
              args.component.emit(c.DATA_VALUE, this.value)
            },
          )
        }
        // VIDEO
        else if (Identify.component.video(args.component)) {
          const videoEl = args.node as HTMLVideoElement
          let sourceEl: HTMLSourceElement
          let notSupportedEl: HTMLParagraphElement
          videoEl.controls = Identify.isBooleanTrue(controls)
          videoEl.autoplay = Identify.isBooleanTrue(autoplay)

          const attrs = ['poster', ['src', 'path']]
          attrs.forEach((attr) => {
            if (u.isArr(attr)) {
              const [attrib, key] = attr
              const value = args.component.props[key]
              !u.isNil(value) && setAttr(attrib, value)

              if (attrib === 'src') {
                sourceEl = document.createElement('source')
                notSupportedEl = document.createElement('p')
                if (videoType) sourceEl.setAttribute('type', videoType)
                sourceEl.setAttribute('src', value)
                notSupportedEl.style.textAlign = 'center'
                // This text will not appear unless the browser isn't able to play the video
                notSupportedEl.innerHTML =
                  "Sorry, your browser doesn's support embedded videos."
                videoEl.appendChild(sourceEl)
                videoEl.appendChild(notSupportedEl)
              }
            } else {
              const value = args.component.props[attr]
              !u.isNil(value) && setAttr(attr, value)
            }
          })

          if (args.component.blueprint?.['path=func']) {
            args.component?.get?.(c.DATA_VALUE)?.then?.((path: any) => {
              setAttr('src', path?.url)
            })
          }

          videoEl.style.objectFit = 'contain'
        }
      }

      return args.node
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

export default componentsResolver

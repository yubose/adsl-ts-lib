import * as u from '@jsmanifest/utils'
import startOfDay from 'date-fns/startOfDay'
import { Identify, userEvent } from 'noodl-types'
import {
  _isScriptEl,
  addClassName,
  isDisplayable,
  normalizeEventName,
} from '../utils'
import type NDOMResolver from '../Resolver'
import * as t from '../../types'
import * as i from '../../utils/internal'
import * as c from '../../constants'

const is = Identify

function attachText<N extends t.NDOMElement>(node: N, ...text: string[]) {
  if (!node.innerHTML.trim()) {
    const value = text.find(Boolean) || ''
    node.innerHTML = isDisplayable(value) ? value : ''
  }
  return node
}

function attachDataAttrs<N extends t.NDOMElement>(
  node: N,
  component: t.NuiComponent.Instance,
  setAttr: ReturnType<NDOMResolver['getOptions']>['setAttr'],
  setDataAttr: ReturnType<NDOMResolver['getOptions']>['setDataAttr'],
) {
  for (const key of c.lib.dataAttributes) {
    if (component?.get?.(key)) {
      setDataAttr(key, component.get(key) || '')
      if ('value' in node && key === c.DATA_VALUE) {
        const value = component.get(key)
        setAttr('value' as any, value)
        if (u.isStr(value) && /hide_textfield/i.test(value)) {
          node.style.visibility = 'hidden'
        }
      }
    }
  }
}

function attachUserEvents<N extends t.NDOMElement>(
  node: N,
  component: t.NuiComponent.Instance,
) {
  userEvent.forEach((eventType: string) => {
    /**
     * TODO - Don't include DOM events in this loop. Instead, the user can register them via noodl-ui-dom resolve API
     * - onBlur
     * - onChange
     * - onInput
     */
    if (eventType === 'onChange') return
    if (eventType === 'onInput') return

    if (u.isFnc(component.get?.(eventType)?.execute)) {
      /**
       * Putting a setTimeout here helps to avoid the race condition in
       * where the emitted action handlers are being called before local
       * root object gets their data values updated.
       */
      if (eventType === 'onLazyLoading') {
        let event: Event = new Event('onLazyLoading', {
          bubbles: true,
          cancelable: false,
        })
        node.addEventListener('scroll', (...args) => {
          let viewHeight =
            node.clientHeight || document.documentElement.clientHeight
          let contentHeight =
            node.scrollHeight || document.documentElement.scrollHeight //内容高度
          let scrollTop = node.scrollTop || document.documentElement.scrollTop
          if (contentHeight - viewHeight - scrollTop === 0) {
            //到达底部0px时,加载新内容
            node.dispatchEvent(event)
          }
        })
        node.addEventListener('onLazyLoading', (...args) => {
          // console.log('GGGG', node.scrollTop)
          setTimeout(() => {
            // @ts-expect-error
            ;(component.get?.(eventType) as t.NUIActionChain)?.execute?.(
              ...args,
            )
          })
        })
        // window.setTimeout(()=>{
        //   node.scrollTop = node.scrollHeight - 1000;
        // })
        return
      }
      node.addEventListener(normalizeEventName(eventType), (...args) =>
        setTimeout(() => component.get?.(eventType)?.execute?.(...args)),
      )
    }
  })
}

function handleKeyPress<N extends t.NDOMElement>(node: N) {
  function onKeyPress(n: N, evt: KeyboardEvent) {
    if (evt.key === 'Enter') {
      const inputs = document.querySelectorAll('input')
      const currentIndex = [...inputs].findIndex((el) => n.isEqualNode(el))
      const targetIndex = (currentIndex + 1) % inputs.length
      if (currentIndex + 1 < inputs.length) inputs[targetIndex]?.focus?.()
    }
  }
  node.addEventListener('keypress', onKeyPress.bind(null, node))
}

const attributesResolver: t.Resolve.Config = {
  name: `[noodl-ui-dom] attributes`,
  async before({
    componentType,
    elementType,
    component,
    node,
    setAttr,
    setStyleAttr,
  }) {
    try {
      if (node && component) {
        setAttr('id', component.id || '')
        if (elementType === 'SCRIPT') {
          if (component.has('global')) {
            if (!component.get('data-src')) {
              component.on('image', (src: string) =>
                setStyleAttr('backgroundImage', `url("${src}")`),
              )
            }
            setStyleAttr(
              'backgroundImage',
              `url("${component.get('data-src')}")`,
            )
          }
        } else if (componentType === 'page' && elementType === 'IFRAME') {
          // Set default values now but can be overriden when we go over the style resolvers
          node.style.position = 'absolute'
          node.style.width = '100%'
          node.style.height = '100%'
        }
      }
    } catch (error) {
      console.error(error)
    }
  },
  async resolve(args) {
    const { elementType, setAttr, setDataAttr, setStyleAttr } = args

    try {
      if (args.node) {
        if (args.component) {
          if (Identify.component.page(args.component)) {
            // console.info(`PAGE COMPONENT`, args.global.pages)
          }

          const { path, placeholder, style, textBoard } =
            args.component.blueprint || {}

          /* -------------------------------------------------------
            ---- GENERAL / COMMON DOM NODES
          -------------------------------------------------------- */
          attachText(
            args.node,
            args.component?.get?.(c.DATA_VALUE),
            args.component?.blueprint?.text,
          )
          /* -------------------------------------------------------
            ---- DATA-ATTRIBUTES
          -------------------------------------------------------- */
          attachDataAttrs(args.node, args.component, setAttr, setDataAttr)
          /* -------------------------------------------------------
            ---- EVENTS
          -------------------------------------------------------- */
          attachUserEvents(args.node, args.component)
          /* -------------------------------------------------------
            ---- ENTER KEY FOR INPUTS
          -------------------------------------------------------- */
          elementType === 'INPUT' && handleKeyPress(args.node)
          /* -------------------------------------------------------
            ---- NON TEXTFIELDS
          -------------------------------------------------------- */

          if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(elementType)) {
            if (
              ['text', c.DATA_PLACEHOLDER, c.DATA_VALUE].some(
                (key) => !!args.component.get(key),
              )
            ) {
              let dataValue = args.component.get(c.DATA_VALUE)
              let placeholder = args.component.get(c.DATA_PLACEHOLDER)
              let text = args.component.get('text')

              text = (u.isStr(dataValue) ? dataValue : text) || text || ''
              !text && placeholder && (text = placeholder)
              !text && (text = '')
              text && args.node && setAttr('innerHTML', `${text}`)
            }
          }

          /* -------------------------------------------------------
            ---- PATHS (non videos)
          -------------------------------------------------------- */
          if (path && !['IFRAME', 'VIDEO'].includes(elementType)) {
            if (args.component.get(c.DATA_SRC)) {
              const src = args.component.get(c.DATA_SRC)
              // @ts-expect-error
              u.forEach((fn) => fn('src', src), [setAttr, setDataAttr])
              args.component.on('path', (result) =>
                // @ts-expect-error
                u.forEach((fn) => fn('src', result), [setAttr, setDataAttr]),
              )
            }
          }

          /* -------------------------------------------------------
            ---- PLACEHOLDERS
          -------------------------------------------------------- */
          if (placeholder) {
            let value =
              args.component.get(c.DATA_PLACEHOLDER) || placeholder || ''
            u.forEach(
              (fn: (...args: any[]) => any) =>
                fn('placeholder', Identify.folds.emit(value) ? '' : value),
              [setAttr, setDataAttr],
            )
          }

          /* -------------------------------------------------------
            ---- STYLES
          -------------------------------------------------------- */
          if (!_isScriptEl(args.node) && u.isObj(style)) {
            u.isObj(args.component.style.textAlign) &&
              delete args.component.style.textAlign

            if (
              !('marginTop' in args.component.style) ||
              !('marginTop' in (style || {}))
            ) {
              args.component.style.marginTop = '0px'
            }

            for (const [k, v] of u.entries(args.component.style)) {
              if (Number.isFinite(Number(k))) continue
              args.node.style && setStyleAttr(k as any, String(v))
            }

            if (Identify.component.canvas(args.component)) {
              if (args.node.parentElement) {
                const parentWidth = args.node.parentElement.style.width
                const parentHeight = args.node.parentElement.style.height
                setAttr('width', Number(parentWidth.replace(/[a-zA-Z]+/g, '')))
                setAttr(
                  'height',
                  Number(parentHeight.replace(/[a-zA-Z]+/g, '')),
                )
                setStyleAttr('width', parentWidth)
                setStyleAttr('height', parentHeight)
              }
            }
          }

          /* -------------------------------------------------------
            ---- TEXT=FUNC
          -------------------------------------------------------- */
          if (args.component.blueprint?.['text=func']) {
            if (args.component.contentType === 'timer') {
              const dataKey = args.component.blueprint?.dataKey as string
              // TODO - Refactor a better way to get the initial value since the
              // call order isn't guaranteed
              args.component.on('timer:init', (initialValue?: Date) => {
                const pageName = args.page.page
                const timer =
                  args.global.timers.get(dataKey) ||
                  args.global.timers.set(dataKey, {
                    initialValue: initialValue || startOfDay(new Date()),
                    pageName,
                  })

                if (initialValue && timer.value !== initialValue) {
                  timer.value = initialValue
                }

                timer.pageName !== pageName && (timer.pageName = pageName)

                timer.on('increment', (v: any) =>
                  args.component.emit('timer:interval', v),
                )
                // @ts-expect-error
                args.component.emit('timer:ref', timer)

                args.page.once(c.eventId.page.on.ON_DOM_CLEANUP, () => {
                  timer.clear()
                  timer.onClear = undefined
                  timer.onIncrement = undefined
                  args.component.clear('hooks')
                })
              })
            } else {
              args.node &&
                setAttr('textContent', args.component.get('data-value') || '')
            }
          }

          /* -------------------------------------------------------
            ---- TEMP - Experimenting CSS
          -------------------------------------------------------- */
          const classes = {
            canvas: 'canvas',
            global: {
              identify: (c: t.NuiComponent.Instance) => c.has('global'),
              className: 'global',
            },
            label: 'label',
            page: 'page',
            popUp: 'popup',
            scrollView: 'scroll-view',
            textBoard: 'text-board',
          } as const

          u.forEach(
            ([name, className]) =>
              [is.component[name] || classes[name]?.['identify']].find(
                u.isFnc,
              )?.(args.component) &&
              addClassName(
                u.isStr(className)
                  ? className
                  : classes[name]?.['className'] || '',
                args.node,
              ),
            u.entries(classes),
          )
        }
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

export default attributesResolver

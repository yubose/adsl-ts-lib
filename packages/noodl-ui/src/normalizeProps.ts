// @ts-nocheck
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import lget from 'lodash/get'
import lset from 'lodash/set'
import lunset from 'lodash/unset'
import NuiViewport from './Viewport'
import { presets } from './constants'
import { findIteratorVar, findListDataObject } from './utils/noodl'
import is from './utils/is'
import getBaseStyles from './utils/getBaseStyles'
import getByRef from './utils/getByRef'
import type { NormalizePropsContext } from './types'
import * as com from './utils/common'
import * as s from './utils/style'

export interface ParseOptions<
  Props extends Record<string, any> = Record<string, any>,
> {
  /**
   * Any data needed to render/parse components
   */
  context?: NormalizePropsContext
  /**
   * If true, styles like fontSize will be converted to <number>vw or <number>vh if given the format
   */
  keepVpUnit?: boolean
  /**
   * A custom function called when resolving traversal references (ex: ___.viewTag).
   *
   * When resolving traversal referencies, if no function is provided then undefined will be returned
   */
  getParent?: (opts: {
    props: Record<string, any>
    blueprint: Partial<Props>
    context: NormalizePropsContext
    op?: 'traverse' | undefined
    opArgs?: Record<string, any>
  }) => any
  getHelpers?: (opts?: Record<string, any>) => {
    props: Record<string, any>
    getParent?: any
    blueprint: Partial<Props>
    context: NormalizePropsContext
    root: Record<string, any> | (() => Record<string, any>)
    rootKey: string
  }
  /**
   * Current page. If retrieving local root references, it will use this variable
   * as the local root key
   */
  pageName?: string
  /**
   * The root object or a function that returns the root object. This will
   * be used to cross-reference other page objects if needed
   */
  root?: Record<string, any> | (() => Record<string, any>)
  /**
   * A viewport containing the width/height.
   * This will be used to resolve the positioning/sizes of component styles
   */
  viewport?: NuiViewport | { width: number; height: number }
  assign?: (obj: any, ...rest: any[]) => any
  entries?: typeof Object.entries
  isArr?: (v: any) => boolean
  isObj?: (obj: any) => boolean
  isNil?: (v: any) => boolean
  isNum?: (v: any) => boolean
  isStr?: (str: any) => boolean
  isUnd?: (v: any) => boolean
  toArr?: (v: any) => any
  get?: <C = any>(component: C, key: any, initialValue?: any) => any
  set?: (obj: any, key: string | number, value: any) => void
  unset?: (obj: any, key: string | number) => void
}

/**
 *
 * Normalizes + parses a component object for browsers to consume
 *   @example
 *
  ```js
    const componentObject = { style: { shadow: 'true' } }
    const normalized = { style: { boxShadow: '5px 5px 10px 3px rgba(0, 0, 0, 0.015)' } }
  ```
 */

function parse<Props extends Record<string, any> = Record<string, any>>(
  blueprint: Partial<Props>,
  parseOptions: ParseOptions<Props>,
): any

function parse<Props extends Record<string, any> = Record<string, any>>(
  props: Record<string, any>,
  blueprint: Partial<Props>,
  parseOptions: ParseOptions<Props>,
): any

function parse<Props extends Record<string, any> = Record<string, any>>(
  props: Record<string, any> = { style: {} },
  blueprint: Partial<Props> = {},
  parseOptions: ParseOptions<Props> = {},
) {
  if (typeof parseOptions === undefined) {
    parseOptions = blueprint as ParseOptions<Props>
    blueprint = props
    props = {}
    return parse(props, blueprint, {
      ...parseOptions,
      assign: Object.assign,
      entries: Object.entries,
      isArr: u.isArr,
      isObj: u.isObj,
      isStr: u.isStr,
      isNum: u.isNum,
      isNil: u.isNil,
      isUnd: u.isUnd,
      get: lget,
      set: lset,
      unset: lunset,
      toArr: u.array,
      getHelpers: (opts) => ({
        blueprint,
        context: context || {},
        getParent: parseOptions?.getParent,
        props,
        root: parseOptions?.root || {},
        rootKey: parseOptions?.pageName || '',
        ...opts,
      }),
    })
  }

  const {
    context,
    getParent,
    getHelpers,
    keepVpUnit,
    pageName = '',
    root = {},
    assign = Object.assign,
    entries = Object.entries,
    isArr = u.isArr,
    isObj = u.isObj,
    isStr = u.isStr,
    isNil = u.isNil,
    isNum = u.isNum,
    isUnd = u.isUnd,
    toArr = u.array,
    get = lget,
    set = lset,
    unset = lunset,
    viewport,
  } = parseOptions

  if (!u.isFnc(getHelpers)) {
    return parse(props, blueprint, {
      assign: Object.assign,
      entries: Object.entries,
      isArr: u.isArr,
      isObj: u.isObj,
      isStr: u.isStr,
      isNil: u.isNil,
      isNum: u.isNum,
      isUnd: u.isUnd,
      get: lget,
      set: lset,
      unset: lunset,
      toArr: u.array,
      ...arguments[2],
      getHelpers: (opts) => ({
        getParent,
        props,
        blueprint,
        context,
        root,
        rootKey: pageName,
        ...opts,
      }),
    })
  }

  if (props && !get(props, 'style')) set(props, 'style', {})

  if (isObj(get(blueprint, 'style'))) {
    for (const [key, value] of entries(getBaseStyles(blueprint, root))) {
      set(get(props, 'style'), key, value)
    }
  }

  if (isObj(blueprint)) {
    set(props, 'type', get(blueprint, 'type'))

    let iteratorVar =
      get(context, 'iteratorVar') || findIteratorVar(props) || ''

    for (const [originalKey, originalValue] of entries(blueprint)) {
      let value = get(props, originalKey)

      if (originalKey === 'dataKey') {
        if (isStr(originalValue)) {
          let datapath = nu.toDataPath(nu.trimReference(originalValue))
          let isLocalKey = is.localKey(datapath.join('.'))
          // Note: This is here for fallback reasons.
          // dataKey should never be a reference in the noodl
          if (is.reference(originalValue)) {
            isLocalKey = is.localReference(originalValue)
          }
          const dataValue = get(
            isLocalKey ? get(root, pageName) : root,
            datapath,
          )
          set(props, 'data-value', dataValue)
          if (is.component.select(blueprint)) {
            const dataOptions = isStr(get(blueprint, 'options'))
              ? get(isLocalKey ? get(root, pageName) : root, datapath)
              : toArr(get(blueprint, 'options'))
            set(props, 'data-options', dataOptions)
          }
          continue
        }
      } else if (originalKey === 'options') {
        if (is.component.select(blueprint)) {
          const dataKey = get(blueprint, 'dataKey')
          const isUsingDataKey = isStr(dataKey) || isStr(originalValue)
          // Receiving their options by reference
          if (isUsingDataKey && !isArr(originalValue)) {
            let dataPath = isStr(dataKey) ? dataKey : String(originalValue)
            let dataObject: any
            let isListPath = !!iteratorVar && dataPath.startsWith(iteratorVar)

            value = dataPath ? get(dataObject, dataPath) : dataObject

            if (!isArr(value)) {
              if (isListPath) {
                dataPath = nu.excludeIteratorVar(dataPath, iteratorVar) || ''
                dataObject =
                  get(context, 'dataObject') || findListDataObject(props)
              } else {
                dataPath = nu.trimReference(dataPath)
                value = get(
                  is.localKey(dataPath) ? get(root, pageName) : root,
                  dataPath,
                )
              }
            }
          }
          set(props, 'data-options', value || [])
          if (!get(props, 'options')) {
            set(props, 'options', get(props, 'data-options'))
          }
        }
      } else if (originalKey === 'style') {
        // Style keys to be removed (for the DOM) after processing
        const delKeys = [] as string[]
        const markDelete = (v: any) => !delKeys.includes(v) && delKeys.push(v)
        // Values to restore after processing to ensure that they are re-written back if overwritten
        const restoreVals = {} as Record<string, any>

        if (isObj(originalValue)) {
          const {
            align,
            axis,
            border,
            borderRadius,
            borderWidth,
            display,
            fontFamily,
            fontSize,
            fontStyle,
            textAlign,
            verticalAlign,
          } = originalValue

          /* -------------------------------------------------------
            ---- COMPONENTS
          -------------------------------------------------------- */

          if (is.component.header(blueprint)) {
            set(get(props, 'style'), 'zIndex', 100)
          } else if (is.component.image(blueprint)) {
            // Remove the height to maintain the aspect ratio since images are
            // assumed to have an object-fit of 'contain'
            if (!('height' in (get(blueprint, 'style') || {}))) {
              unset(props, 'style.height')
            }
            // Remove the width to maintain the aspect ratio since images are
            // assumed to have an object-fit of 'contain'
            if (!('width' in (get(blueprint, 'style') || {}))) {
              unset(props, 'style.width')
            }
            if (!('objectFit' in (get(blueprint, 'style') || {}))) {
              set(get(props, 'style'), 'objectFit', 'contain')
            }
          } else if (
            is.component.listLike(blueprint) &&
            get(props, 'style.display') !== 'none'
          ) {
            const axis = get(blueprint, 'style.axis')
            const display =
              axis === 'horizontal' || axis === 'vertical' ? 'flex' : 'block'
            set(get(props, 'style'), 'display', display)
            set(get(props, 'style'), 'listStyle', 'none')
            // set(get(props, 'style'), 'padding', '0px')
          } else if (is.component.listItem(blueprint)) {
            // Flipping the position to relative to make the list items stack on top of eachother.
            //    Since the container is a type: list and already has their entire height defined in absolute values,
            //    this shouldn't have any UI issues because they'll stay contained within
            set(get(props, 'style'), 'listStyle', 'none')
            // props.style.padding = 0
          } else if (is.component.popUp(blueprint)) {
            set(get(props, 'style'), 'display', 'none')
            set(get(props, 'style'), 'visibility', 'hidden')
          } else if (
            is.component.scrollView(blueprint) &&
            get(props, 'style.display') !== 'none'
          ) {
            set(get(props, 'style'), 'display', 'block')
          } else if (is.component.textView(blueprint)) {
            set(get(props, 'style'), 'rows', 10)
            set(get(props, 'style'), 'resize', 'none')
          } else if (is.component.video(blueprint)) {
            set(get(props, 'style'), 'objectFit', 'contain')
          }

          // AXIS
          if (isStr(axis) && /horizontal|vertical/.test(axis)) {
            markDelete('axis')
            set(value, 'display', 'flex')
            if (axis === 'horizontal') {
              set(value, 'flexWrap', 'nowrap')
            } else if (axis === 'vertical') {
              set(value, 'flexDirection', 'column')
            }
          }

          // ALIGN
          if (isStr(align) && /center[xy]/.test(align)) {
            markDelete('align')
            set(value, 'display', 'flex')
            if (align === 'centerX') {
              set(value, 'justifyContent', 'center')
            } else if (align === 'centerY') {
              set(value, 'alignItems', 'center')
            }
          }

          // TEXTALIGN
          if (textAlign) {
            // "centerX", "centerY", "left", "center", "right"
            if (isStr(textAlign)) {
              if (textAlign === 'left') set(value, 'textAlign', 'left')
              else if (textAlign === 'center') set(value, 'textAlign', 'center')
              else if (textAlign === 'right') set(value, 'textAlign', 'right')
              else if (textAlign === 'centerX') {
                set(value, 'textAlign', 'center')
                set(restoreVals, 'textAlign', 'center')
              } else if (textAlign === 'centerY') {
                set(value, 'display', 'flex')
                set(value, 'alignItems', 'center')
                markDelete('textAlign')
              }
            }
            // { x, y }
            else if (isObj(textAlign)) {
              const x = get(textAlign, 'x')
              const y = get(textAlign, 'y')
              if (!isNil(get(textAlign, 'x'))) {
                const _textAlign = x === 'centerX' ? 'center' : x
                set(value, 'textAlign', _textAlign)
              }
              if (y != undefined) {
                // The y value needs to be handled manually here since s.getTextAlign will
                //    return { textAlign } which is meant for x
                if (y === 'center' || y === 'centerY') {
                  let convert = new Map([
                    ['left', 'flex-start'],
                    ['right', 'flex-end'],
                    ['center', 'center'],
                    ['centerX', 'center'],
                  ])
                  // convert (left ,center ,right) to (flex-start | flex-end | center)
                  set(value, 'display', 'flex')
                  set(value, 'alignItems', 'center')
                  set(value, 'justifyContent', convert.get(x ? x : 'left'))
                  if (!x) markDelete('textAlign')
                }
              }
            }
          }

          // DISPLAY
          if (display === 'inline') set(value, 'display', 'inline')
          else if (display === 'inline-block') {
            set(value, 'display', 'inline-block')
            set(value, 'verticalAlign', 'top')
          }

          if (verticalAlign) set(value, 'verticalAlign', verticalAlign)

          /* -------------------------------------------------------
            ---- BORDERS
          -------------------------------------------------------- */

          /**
           * Returns border attributes according to the "border" property defined in the NOODL as well
           * as some native border attributes like "borderRadius"
           *    1) no border / no borderRadius/
           *    2) borderBottom / solid / no borderRadius/
           *    3) borderAll / solid / has borderRadius
           *    4) borderAll / dashed / no borderRadius
           *    5) no border / has borderRadius
           */

          if (border !== undefined) {
            let borderStyle: any
            let color: any
            let width: any
            let line: any

            // if (border == '0') debugger
            if (border == ('0' as any)) set(value, 'borderStyle', 'none')

            if (isObj(border)) {
              borderStyle = get(border, 'style')
              color = get(border, 'color')
              width = get(border, 'width')
              line = get(border, 'line')
            }

            if (color) {
              set(value, 'borderColor', String(color).replace('0x', '#'))
            }
            if (line) set(value, 'borderStyle', line)
            if (width) set(value, 'borderWidth', width)

            // Analyizing border
            if (borderStyle == '1') {
              assign(value, presets.border['1'])
            } else if (borderStyle == '2') {
              assign(value, presets.border['2'])
            } else if (borderStyle == '3') {
              assign(value, presets.border['3'])
              if (!width) set(value, 'borderWidth', 'thin')
            } else if (borderStyle == '4') {
              assign(value, presets.border['4'])
              if (!width) set(value, 'borderWidth', 'thin')
            } else if (borderStyle == '5') {
              assign(value, presets.border['5'])
            } else if (borderStyle == '6') {
              assign(value, presets.border['6'])
            } else if (borderStyle == '7') {
              assign(value, presets.border['7'])
            }
          }

          if (borderWidth) {
            if (isStr(borderWidth)) {
              if (!com.hasLetter(borderWidth)) {
                set(value, 'borderWidth', `${borderWidth}px`)
              }
            } else if (isNum(borderWidth)) {
              set(value, 'borderWidth', `${borderWidth}px`)
            }
          }

          if (borderRadius) {
            if (s.isNoodlUnit(borderRadius)) {
              const _borderRadius = String(
                s.getSize(borderRadius, viewport?.height as number),
              )
              set(value, 'borderRadius', _borderRadius)
            } else {
              if (isStr(borderRadius)) {
                const _borderRadius = !com.hasLetter(borderRadius)
                  ? `${borderRadius}px`
                  : `${borderRadius}`
                set(value, 'borderRadius', _borderRadius)
              } else if (isNum(borderRadius)) {
                set(value, 'borderRadius', `${borderRadius}px`)
              }

              // If a borderRadius effect is to be expected and there is no border
              // (since no border negates borderRadius), we need to add an invisible
              // border to simulate the effect
              const regex = /[a-zA-Z]+$/
              const radius = Number(`${borderRadius}`.replace(regex, ''))
              if (!Number.isNaN(radius)) {
                set(value, 'borderRadius', `${radius}px`)
                const borderWidth = get(value, 'borderWidth')
                if (
                  !(isStr(get(value, 'border')) && get(value, 'border')) &&
                  (!borderWidth ||
                    borderWidth === 'none' ||
                    borderWidth === '0px')
                ) {
                  // Make the border invisible
                  set(value, 'borderWidth', '1px')
                  set(value, 'borderColor', 'rgba(0, 0, 0, 0)')
                }
              }
            }
          }

          if (border?.style) markDelete('border')

          /* -------------------------------------------------------
            ---- FONTS
          -------------------------------------------------------- */

          if (!isUnd(fontSize)) {
            // '10' --> '10px'
            if (isStr(fontSize)) {
              if (!com.hasLetter(fontSize)) {
                if (s.isNoodlUnit(fontSize)) {
                  const _fontSize = String(
                    NuiViewport.getSize(fontSize, viewport?.height as number),
                  )
                  set(value, 'fontSize', _fontSize)
                } else set(value, 'fontSize', `${fontSize}px`)
              }
            }
            // 10 --> '10px'
            else if (isNum(fontSize)) set(value, 'fontSize', `${fontSize}px`)
            // TODO - What is this supposed to be doing
            isStr(fontFamily) && get(value, 'fontFamily')
          }

          // { fontStyle } --> { fontWeight }
          if (fontStyle === 'bold') {
            set(value, 'fontWeight', 'bold')
            markDelete('fontStyle')
          }

          /* -------------------------------------------------------
            ---- POSITION
          -------------------------------------------------------- */

          {
            s.posKeys.forEach((posKey) => {
              if (!isNil(get(originalValue, posKey))) {
                const result = s.getPositionProps(
                  originalValue,
                  posKey,
                  s.getViewportBound(viewport, posKey) as number,
                )
                if (isObj(result)) {
                  for (const [k, v] of entries(result)) set(value, k, v)
                }
              }
            })
            // Remove textAlign if it is an object (NOODL data type is not a valid DOM style attribute)
            if (isObj(get(value, 'textAlign'))) markDelete('textAlign')
          }

          /* -------------------------------------------------------
            ---- SIZES
          -------------------------------------------------------- */

          const { width, height, maxHeight, maxWidth, minHeight, minWidth } =
            originalValue || {}

          // if (viewport) {
          for (const [key, val] of [
            ['width', width],
            ['height', height],
          ]) {
            if (!isNil(val)) {
              const _value = String(
                s.getSize(val, s.getViewportBound(viewport, key) as number),
              )
              set(value, key, _value)
            }
          }
          for (const [key, vpKey, val] of [
            ['maxHeight', 'height', maxHeight],
            ['minHeight', 'height', minHeight],
            ['maxWidth', 'width', maxWidth],
            ['minWidth', 'width', minWidth],
          ]) {
            if (!isNil(val)) {
              const newValue = String(s.getSize(val, viewport?.[vpKey]))
              set(value, key, newValue)
            }
          }
          // }
          // HANDLING ARTBITRARY STYLES
          for (let [styleKey, styleValue] of entries(originalValue)) {
            // Unwrap the reference for processing
            if (isStr(styleValue) && is.reference(styleValue)) {
              const isLocal = is.localReference(styleValue)
              styleValue = getByRef(styleValue, {
                ...getHelpers({ rootKey: isLocal ? pageName : undefined }),
              })
              if (styleKey === 'autoplay') {
                set(blueprint, 'autoplay', styleValue)
              }
            }

            if (s.isKeyRelatedToWidthOrHeight(styleValue as any)) {
              const newValue = String(
                NuiViewport.getSize(
                  styleValue as string | number,
                  s.getViewportBound(viewport, styleKey) as number,
                  { unit: 'px' },
                ),
              )
              set(value, styleKey, newValue)
            }

            if (isStr(styleValue)) {
              while (is.reference(styleValue)) {
                const isLocal = is.localReference(styleValue)
                const newstyleValue = getByRef(
                  styleValue,
                  getHelpers({ rootKey: isLocal ? pageName : undefined }),
                )
                if (newstyleValue === styleValue) break
                // It will do an infinite loop without this
                if (is.traverseReference(styleValue)) break
                styleValue = newstyleValue
              }

              // Resolve vw/vh units (Values directly relative to viewport)
              if (s.isVwVh(styleValue)) {
                if (keepVpUnit) {
                  set(value, styleKey, `calc(${styleValue})`)
                } else {
                  const vpKey = s.getVpKey(styleValue)
                  const vpVal = viewport?.[vpKey as nt.VpUnit] as number
                  const valueNum = s.toNum(styleValue) / 100
                  if (isNil(vpVal)) {
                    set(value, styleKey, styleValue)
                  } else {
                    set(value, styleKey, String(s.getSize(valueNum, vpVal)))
                  }
                }
              }

              // Cache this value to the variable so it doesn't get mutated inside this func since there are moments when value is changing before this func ends
              // If the value is a path of a list item data object
              const isListPath =
                !!iteratorVar && String(styleValue).startsWith(iteratorVar)

              // '2.8vh', '20px', etc
              const isSizeValue =
                s.isVwVh(styleValue) ||
                s.isKeyRelatedToWidthOrHeight(styleKey) ||
                ['fontSize', 'borderRadius', 'borderWidth'].includes(styleKey)

              if (isSizeValue) {
                if (viewport) {
                  if (s.isVwVh(styleValue)) {
                    const valueNum = s.toNum(styleValue) / 100
                    const newValue = keepVpUnit
                      ? `calc(${styleValue})`
                      : String(
                          s.getSize(
                            valueNum,
                            s.getViewportBound(viewport, styleValue) as number,
                          ),
                        )
                    set(value, styleKey, newValue)
                  } else if (s.isKeyRelatedToWidthOrHeight(styleKey)) {
                    const computedValue = s.isNoodlUnit(styleValue)
                      ? String(
                          NuiViewport.getSize(
                            styleValue,
                            s.getViewportBound(viewport, styleKey) as number,
                            { unit: 'px' },
                          ),
                        )
                      : undefined
                    if (s.isNoodlUnit(styleValue)) {
                      if (
                        styleValue.includes('%') &&
                        styleKey === 'borderRadius'
                      ) {
                        set(value, styleKey, styleValue)
                      } else {
                        set(value, styleKey, computedValue)
                      }
                    } else if (s.isKeyRelatedToHeight(styleKey)) {
                      if (styleKey == 'borderRadius' && isStr(styleValue)) {
                        if (styleValue.includes('px')) {
                          set(value, styleKey, `${styleValue}`)
                        } else {
                          set(value, styleKey, `${styleValue}px`)
                        }
                      }
                    }
                  }
                }
              } else {
                set(value, styleKey, com.formatColor(styleValue as any))
              }

              if (styleKey == 'pointerEvents' && styleValue != 'none') {
                markDelete('pointerEvents')
              }

              if (styleKey == 'isHidden' && is.isBooleanTrue(styleValue)) {
                set(get(props, 'style'), 'display', 'none')
              }

              // TODO - Find out how to resolve the issue of "value" being undefined without this string check when we already checked above this
              if (
                isStr(styleValue) &&
                (styleKey === 'textColor' ||
                  styleValue.startsWith('0x') ||
                  isListPath)
              ) {
                /* -------------------------------------------------------
                    ---- COLORS - REMINDER: Convert color values like 0x00000000 to #00000000
                  -------------------------------------------------------- */
                if (styleKey === 'textColor') {
                  set(value, 'color', com.formatColor(styleValue))
                  markDelete('textColor')
                } else {
                  // Some list item consumers have data keys referencing color data values
                  // They are in the 0x0000000 form so we must convert them to be DOM compatible

                  if (isListPath) {
                    const dataObject =
                      get(context, 'dataObject') || findListDataObject(props)
                    if (isObj(dataObject)) {
                      const dataKey = nu.excludeIteratorVar(
                        styleValue,
                        iteratorVar,
                      ) as string

                      let _styleValue = com.formatColor(
                        get(dataObject, dataKey),
                      )

                      if (s.isKeyRelatedToWidthOrHeight(styleKey)) {
                        _styleValue = String(_styleValue)
                        if (s.isNoodlUnit(_styleValue)) {
                          const newValue = String(
                            NuiViewport.getSize(
                              _styleValue,
                              s.getViewportBound(viewport, styleKey) as number,
                              { unit: 'px' },
                            ),
                          )
                          set(value, styleKey, newValue)
                        }
                      } else if (styleKey === 'pointerEvents') {
                        set(value, 'pointer-events', _styleValue)
                      } else {
                        set(value, styleKey, _styleValue)
                      }
                    } else {
                      set(value, styleKey, com.formatColor(String(dataObject)))
                    }
                  }

                  if (isStr(styleValue) && styleValue.startsWith('0x')) {
                    set(value, styleKey, com.formatColor(styleValue))
                  }
                }
              }
            }
          }
        } else if (isStr(originalValue)) {
          // Unparsed style value (reference)
        }
        delKeys.forEach((key) => unset(value, key))
        entries(restoreVals).forEach(([k, v]) => set(value, k, v))
      } else if (originalKey === 'viewTag') {
        const viewTag = is.reference(value)
          ? getByRef(
              value,
              getHelpers({
                rootKey: is.localReference(value) ? pageName : undefined,
              }),
            )
          : value || originalValue
        set(props, 'data-viewtag', viewTag)
      } else if (originalKey === 'dataOption') {
        // @ts-expect-error
        let datapath = nu.toDataPath(nu.trimReference(originalValue))
        let isLocalOption = is.localKey(datapath.join('.'))
        // Note: This is here for fallback reasons.
        // dataKey should never be a reference in the noodl
        if (is.reference(originalValue)) {
          isLocalOption = is.localReference(originalValue)
        }
        const dataOption = get(
          isLocalOption ? get(root, pageName) : root,
          datapath,
        )
        set(props, 'data-option', dataOption)
      } else if (originalKey === 'placeholder') {
        // @ts-expect-error
        let datapath = nu.toDataPath(nu.trimReference(originalValue))
        let isLocalOption = is.localKey(datapath.join('.'))
        // Note: This is here for fallback reasons.
        // dataKey should never be a reference in the noodl
        if (is.reference(originalValue)) {
          isLocalOption = is.localReference(originalValue)
        }
        if (isLocalOption) {
          const placeholder = get(
            isLocalOption ? get(root, pageName) : root,
            datapath,
          )
          set(props, 'placeholder', placeholder)
          set(props, 'data-placeholder', placeholder)
        }
      } else if (originalKey === 'videoOption') {
        // @ts-expect-error
        let datapath = nu.toDataPath(nu.trimReference(originalValue))
        let isLocalOption = is.localKey(datapath.join('.'))
        // Note: This is here for fallback reasons.
        // dataKey should never be a reference in the noodl
        if (is.reference(originalValue)) {
          isLocalOption = is.localReference(originalValue)
        }
        const videoOption = get(
          isLocalOption ? get(root, pageName) : root,
          datapath,
        )
        set(props, 'video-option', videoOption)
      } else {
        // Arbitrary references
        if (isStr(originalValue) && is.reference(originalValue)) {
          value = getByRef(originalValue, getHelpers({ rootKey: pageName }))
          set(props, originalKey, value)
        }
      }
    }

    /* -------------------------------------------------------
      ---- OTHER / UNCATEGORIZED
    -------------------------------------------------------- */

    // Shadow
    if (is.isBooleanTrue(get(blueprint, 'style.shadow'))) {
      set(
        get(props, 'style'),
        'boxShadow',
        '5px 5px 10px 3px rgba(0, 0, 0, 0.015)',
      )
      unset(props, 'style.shadow')
    }

    // Visibility
    let isHiddenValue = get(blueprint, 'style.isHidden')
    if (is.reference(isHiddenValue)) {
      const isLocal = is.localReference(isHiddenValue)
      isHiddenValue = getByRef(
        isHiddenValue,
        getHelpers({ rootKey: isLocal ? pageName : undefined }),
      )
    }

    is.isBooleanTrue(isHiddenValue) && set(props, 'style.display', 'none')

    if (is.isBoolean(get(blueprint, 'required'))) {
      set(props, 'required', is.isBooleanTrue(get(blueprint, 'required')))
    }
  } else {
    /**
     * - Referenced components (ex: '.BaseHeader)
     * - Text
     */
    if (isStr(blueprint) && is.reference(blueprint)) {
      return parse(
        props,
        getByRef(
          blueprint,
          getHelpers({
            rootKey: is.localReference(blueprint) ? pageName : undefined,
          }),
        ),
      )
    } else {
      console.log({ SEE_WHAT_THIS_IS: blueprint })
    }
  }

  return props
}

export default parse

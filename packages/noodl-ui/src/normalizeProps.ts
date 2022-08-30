import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import get from 'lodash/get'
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
  if (u.isUnd(parseOptions)) {
    parseOptions = blueprint as ParseOptions<Props>
    blueprint = props
    props = {}
    return parse(props, blueprint, {
      ...parseOptions,
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
    viewport,
  } = parseOptions

  if (!u.isFnc(getHelpers)) {
    return parse(props, blueprint, {
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

  if (props && !props.style) props.style = {}

  if (u.isObj(blueprint?.style)) {
    for (const [key, value] of u.entries(getBaseStyles(blueprint, root))) {
      props.style[key] = value
    }
  }

  if (u.isObj(blueprint)) {
    props.type = blueprint.type

    let iteratorVar = context?.iteratorVar || findIteratorVar(props) || ''

    for (const [originalKey, originalValue] of u.entries(blueprint)) {
      let value = props?.[originalKey]

      if (originalKey === 'dataKey') {
        if (u.isStr(originalValue)) {
          let datapath = nu.toDataPath(nu.trimReference(originalValue))
          let isLocalKey = is.localKey(datapath.join('.'))
          // Note: This is here for fallback reasons.
          // dataKey should never be a reference in the noodl
          if (is.reference(originalValue)) {
            isLocalKey = is.localReference(originalValue)
          }
          props['data-value'] = get(
            isLocalKey ? root[pageName] : root,
            datapath,
          )
          if (is.component.select(blueprint)) {
            props['data-options'] = u.isStr(blueprint.options)
              ? get(isLocalKey ? root[pageName] : root, datapath)
              : u.array(blueprint.options)
          }
          continue
        }
      } else if (originalKey === 'options') {
        if (is.component.select(blueprint)) {
          const dataKey = blueprint.dataKey
          const isUsingDataKey = u.isStr(dataKey) || u.isStr(originalValue)
          // Receiving their options by reference
          if (isUsingDataKey && !u.isArr(originalValue)) {
            let dataPath = u.isStr(dataKey) ? dataKey : String(originalValue)
            let dataObject: any
            let isListPath = !!iteratorVar && dataPath.startsWith(iteratorVar)

            value = dataPath ? get(dataObject, dataPath) : dataObject

            if (!u.isArr(value)) {
              if (isListPath) {
                dataPath = nu.excludeIteratorVar(dataPath, iteratorVar) || ''
                dataObject = context?.dataObject || findListDataObject(props)
              } else {
                dataPath = nu.trimReference(dataPath)
                value = get(
                  is.localKey(dataPath) ? root[pageName] : root,
                  dataPath,
                )
              }
            }
          }
          props['data-options'] = value || []
          if (!props.options) props.options = props['data-options']
        }
      } else if (originalKey === 'style') {
        // Style keys to be removed (for the DOM) after processing
        const delKeys = [] as string[]
        const markDelete = (v: any) => !delKeys.includes(v) && delKeys.push(v)
        // Values to restore after processing to ensure that they are re-written back if overwritten
        const restoreVals = {} as Record<string, any>

        if (u.isObj(originalValue)) {
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

          // AXIS
          if (u.isStr(axis) && /horizontal|vertical/.test(axis)) {
            markDelete('axis')
            value.display = 'flex'
            if (axis === 'horizontal') {
              value.flexWrap = 'nowrap'
            } else if (axis === 'vertical') {
              value.flexDirection = 'column'
            }
          }

          // ALIGN
          if (u.isStr(align) && /center[xy]/.test(align)) {
            markDelete('align')
            value.display = 'flex'
            if (align === 'centerX') {
              value.justifyContent = 'center'
            } else if (align === 'centerY') {
              value.alignItems = 'center'
            }
          }

          // TEXTALIGN
          if (textAlign) {
            // "centerX", "centerY", "left", "center", "right"
            if (u.isStr(textAlign)) {
              if (textAlign === 'left') value.textAlign = 'left'
              else if (textAlign === 'center') value.textAlign = 'center'
              else if (textAlign === 'right') value.textAlign = 'right'
              else if (textAlign === 'centerX') {
                value.textAlign = 'center'
                restoreVals.textAlign = 'center'
              } else if (textAlign === 'centerY') {
                value.display = 'flex'
                value.alignItems = 'center'
                markDelete('textAlign')
              }
            }
            // { x, y }
            else if (u.isObj(textAlign)) {
              if (!u.isNil(textAlign.x)) {
                value.textAlign =
                  textAlign.x === 'centerX' ? 'center' : textAlign.x
              }
              if (textAlign.y != undefined) {
                // The y value needs to be handled manually here since s.getTextAlign will
                //    return { textAlign } which is meant for x
                if (textAlign.y === 'center' || textAlign.y === 'centerY') {
                  let convert = new Map([
                    ['left', 'flex-start'],
                    ['right', 'flex-end'],
                    ['center', 'center'],
                  ])
                  // convert (left ,center ,right) to (flex-start | flex-end | center)
                  value.display = 'flex'
                  value.alignItems = 'center'
                  value.justifyContent = convert.get(
                    textAlign.x ? textAlign.x : 'left',
                  )
                  if (!textAlign.x) markDelete('textAlign')
                }
              }
            }
          }

          // DISPLAY
          if (display === 'inline') value.display = 'inline'
          else if (display === 'inline-block') {
            value.display = 'inline-block'
            value.verticalAlign = 'top'
          }

          if (verticalAlign) {
            value.verticalAlign = verticalAlign
          }

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
            if (border == ('0' as any)) value.borderStyle = 'none'

            if (u.isObj(border)) {
              borderStyle = border.style
              color = border.color
              width = border.width
              line = border.line
            }

            if (color) value.borderColor = String(color).replace('0x', '#')
            if (line) value.borderStyle = line
            if (width) value.borderWidth = width

            // Analyizing border
            if (borderStyle == '1') {
              u.assign(value, presets.border['1'])
            } else if (borderStyle == '2') {
              u.assign(value, presets.border['2'])
            } else if (borderStyle == '3') {
              u.assign(value, presets.border['3'])
              if (!width) value.borderWidth = 'thin'
            } else if (borderStyle == '4') {
              u.assign(value, presets.border['4'])
              if (!width) value.borderWidth = 'thin'
            } else if (borderStyle == '5') {
              u.assign(value, presets.border['5'])
            } else if (borderStyle == '6') {
              u.assign(value, presets.border['6'])
            } else if (borderStyle == '7') {
              u.assign(value, presets.border['7'])
            }
          }

          if (borderWidth) {
            if (u.isStr(borderWidth)) {
              if (!com.hasLetter(borderWidth)) {
                value.borderWidth = `${borderWidth}px`
              }
            } else if (u.isNum(borderWidth)) {
              value.borderWidth = `${borderWidth}px`
            }
          }

          if (borderRadius) {
            if (s.isNoodlUnit(borderRadius)) {
              value.borderRadius = String(
                s.getSize(borderRadius, viewport?.height as number),
              )
            } else {
              if (u.isStr(borderRadius)) {
                value.borderRadius = !com.hasLetter(borderRadius)
                  ? `${borderRadius}px`
                  : `${borderRadius}`
              } else if (u.isNum(borderRadius)) {
                value.borderRadius = `${borderRadius}px`
              }

              // If a borderRadius effect is to be expected and there is no border
              // (since no border negates borderRadius), we need to add an invisible
              // border to simulate the effect
              const regex = /[a-zA-Z]+$/
              const radius = Number(`${borderRadius}`.replace(regex, ''))
              if (!Number.isNaN(radius)) {
                value.borderRadius = `${radius}px`
                if (
                  !(u.isStr(value.border) && value.border) &&
                  (!value.borderWidth ||
                    value.borderWidth === 'none' ||
                    value.borderWidth === '0px')
                ) {
                  // Make the border invisible
                  value.borderWidth = '1px'
                  value.borderColor = 'rgba(0, 0, 0, 0)'
                }
              }
            }
          }

          if (border?.style) markDelete('border')

          /* -------------------------------------------------------
            ---- FONTS
          -------------------------------------------------------- */

          if (!u.isUnd(fontSize)) {
            // '10' --> '10px'
            if (u.isStr(fontSize)) {
              if (!com.hasLetter(fontSize)) {
                if (s.isNoodlUnit(fontSize)) {
                  value.fontSize = String(
                    NuiViewport.getSize(fontSize, viewport?.height as number),
                  )
                } else value.fontSize = `${fontSize}px`
              }
            }
            // 10 --> '10px'
            else if (u.isNum(fontSize)) value.fontSize = `${fontSize}px`
            u.isStr(fontFamily) && value.fontFamily
          }

          // { fontStyle } --> { fontWeight }
          if (fontStyle === 'bold') {
            value.fontWeight = 'bold'
            markDelete('fontStyle')
          }

          /* -------------------------------------------------------
            ---- POSITION
          -------------------------------------------------------- */

          {
            s.posKeys.forEach((posKey) => {
              if (!u.isNil(originalValue?.[posKey])) {
                const result = s.getPositionProps(
                  originalValue,
                  posKey,
                  s.getViewportBound(viewport, posKey) as number,
                )
                if (u.isObj(result)) {
                  for (const [k, v] of u.entries(result)) value[k] = v
                }
              }
            })
            // Remove textAlign if it is an object (NOODL data type is not a valid DOM style attribute)
            if (u.isObj(value?.textAlign)) markDelete('textAlign')
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
            if (!u.isNil(val)) {
              value[key] = String(
                s.getSize(val, s.getViewportBound(viewport, key) as number),
              )
            }
          }
          for (const [key, vpKey, val] of [
            ['maxHeight', 'height', maxHeight],
            ['minHeight', 'height', minHeight],
            ['maxWidth', 'width', maxWidth],
            ['minWidth', 'width', minWidth],
          ]) {
            if (!u.isNil(val)) {
              value[key] = String(s.getSize(val, viewport?.[vpKey]))
            }
          }
          // }
          // HANDLING ARTBITRARY STYLES
          for (let [styleKey, styleValue] of u.entries(originalValue)) {
            // Unwrap the reference for processing
            if (u.isStr(styleValue) && is.reference(styleValue)) {
              const isLocal = is.localReference(styleValue)
              styleValue = getByRef(styleValue, {
                ...getHelpers({ rootKey: isLocal ? pageName : undefined }),
              })
              if (styleKey === 'autoplay') {
                //@ts-expect-error
                blueprint.autoplay = styleValue
              }
            }

            if (s.isKeyRelatedToWidthOrHeight(styleValue)) {
              value[styleKey] = String(
                NuiViewport.getSize(
                  styleValue,
                  s.getViewportBound(viewport, styleKey) as number,
                  { unit: 'px' },
                ),
              )
            }

            if (u.isStr(styleValue)) {
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
                  value[styleKey] = `calc(${styleValue})`
                } else {
                  const vpKey = s.getVpKey(styleValue)
                  const vpVal = viewport?.[vpKey as nt.VpUnit] as number
                  const valueNum = s.toNum(styleValue) / 100
                  if (u.isNil(vpVal)) {
                    value[styleKey] = styleValue
                  } else {
                    value[styleKey] = String(s.getSize(valueNum, vpVal))
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
                    value[styleKey] = keepVpUnit
                      ? `calc(${styleValue})`
                      : String(
                          s.getSize(
                            valueNum,
                            s.getViewportBound(viewport, styleValue) as number,
                          ),
                        )
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
                      value[styleKey] = computedValue
                    } else if (s.isKeyRelatedToHeight(styleKey)) {
                      if (styleKey == 'borderRadius' && u.isStr(styleValue)) {
                        if (styleValue.includes('px')) {
                          value[styleKey] = `${styleValue}`
                        } else {
                          value[styleKey] = `${styleValue}px`
                        }
                      }
                    }
                  }
                }
              } else {
                value[styleKey] = com.formatColor(styleValue)
              }

              if (styleKey == 'pointerEvents' && styleValue != 'none') {
                markDelete('pointerEvents')
              }

              if (styleKey == 'isHidden' && is.isBooleanTrue(styleValue)) {
                props.style.visibility = 'hidden'
              }

              // TODO - Find out how to resolve the issue of "value" being undefined without this string check when we already checked above this
              if (
                u.isStr(styleValue) &&
                (styleKey === 'textColor' ||
                  styleValue.startsWith('0x') ||
                  isListPath)
              ) {
                /* -------------------------------------------------------
                    ---- COLORS - REMINDER: Convert color values like 0x00000000 to #00000000
                  -------------------------------------------------------- */
                if (styleKey === 'textColor') {
                  value.color = com.formatColor(styleValue)
                  markDelete('textColor')
                } else {
                  // Some list item consumers have data keys referencing color data values
                  // They are in the 0x0000000 form so we must convert them to be DOM compatible

                  if (isListPath) {
                    const dataObject =
                      context?.dataObject || findListDataObject(props)
                    if (u.isObj(dataObject)) {
                      const dataKey = nu.excludeIteratorVar(
                        styleValue,
                        iteratorVar,
                      ) as string

                      const _styleValue = com.formatColor(
                        get(dataObject, dataKey),
                      )

                      if (s.isKeyRelatedToWidthOrHeight(styleKey)) {
                        if (s.isNoodlUnit(_styleValue)) {
                          value[styleKey] = String(
                            NuiViewport.getSize(
                              _styleValue,
                              s.getViewportBound(viewport, styleKey) as number,
                              { unit: 'px' },
                            ),
                          )
                        }
                      } else if (styleKey === 'pointerEvents') {
                        value['pointer-events'] = _styleValue
                      } else {
                        value[styleKey] = _styleValue
                      }
                    } else {
                      value[styleKey] = com.formatColor(String(dataObject))
                    }
                  }

                  if (u.isStr(styleValue) && styleValue.startsWith('0x')) {
                    value[styleKey] = com.formatColor(styleValue)
                  }
                }
              }
            }
          }
        } else if (u.isStr(originalValue)) {
          // Unparsed style value (reference)
        }
        delKeys.forEach((key) => delete value[key])
        u.entries(restoreVals).forEach(([k, v]) => (value[k] = v))
      } else if (originalKey === 'viewTag') {
        props['data-viewtag'] = is.reference(value)
          ? getByRef(
              value,
              getHelpers({
                rootKey: is.localReference(value) ? pageName : undefined,
              }),
            )
          : value
      } else if (originalKey === 'dataOption') {
        // @ts-expect-error
        let datapath = nu.toDataPath(nu.trimReference(originalValue))
        let isLocalOption = is.localKey(datapath.join('.'))
        // Note: This is here for fallback reasons.
        // dataKey should never be a reference in the noodl
        if (is.reference(originalValue)) {
          isLocalOption = is.localReference(originalValue)
        }

        props['data-option'] = get(
          isLocalOption ? root[pageName] : root,
          datapath,
        )
      } else if (originalKey === 'placeholder') {
        // @ts-expect-error
        let datapath = nu.toDataPath(nu.trimReference(originalValue))
        let isLocalOption = is.localKey(datapath.join('.'))
        // Note: This is here for fallback reasons.
        // dataKey should never be a reference in the noodl
        if (is.reference(originalValue)) {
          isLocalOption = is.localReference(originalValue);
        }
        if(isLocalOption){
          props['data-placeholder'] = get(
            isLocalOption ? root[pageName] : root,
            datapath,
          )
        }
      }else if (originalKey === 'videoOption') {
        // @ts-expect-error
        let datapath = nu.toDataPath(nu.trimReference(originalValue))
        let isLocalOption = is.localKey(datapath.join('.'))
        // Note: This is here for fallback reasons.
        // dataKey should never be a reference in the noodl
        if (is.reference(originalValue)) {
          isLocalOption = is.localReference(originalValue)
        }
        props['video-option'] = get(
          isLocalOption ? root[pageName] : root,
          datapath,
        )
      } else {
        // Arbitrary references
        if (u.isStr(originalValue) && is.reference(originalValue)) {
          value = getByRef(originalValue, getHelpers({ rootKey: pageName }))
          props[originalKey] = value
        }
      }
    }

    /* -------------------------------------------------------
      ---- COMPONENTS
    -------------------------------------------------------- */

    if (is.component.header(blueprint)) {
      props.style.zIndex = 100
    } else if (is.component.image(blueprint)) {
      // Remove the height to maintain the aspect ratio since images are
      // assumed to have an object-fit of 'contain'
      if (!('height' in (blueprint.style || {}))) delete props.style.height
      // Remove the width to maintain the aspect ratio since images are
      // assumed to have an object-fit of 'contain'
      if (!('width' in (blueprint.style || {}))) delete props.style.width
      if (!('objectFit' in (blueprint.style || {}))) {
        props.style.objectFit = 'contain'
      }
    } else if (
      is.component.listLike(blueprint) &&
      props.style.display !== 'none'
    ) {
      const axis = blueprint.style?.axis
      props.style.display =
        axis === 'horizontal' || axis === 'vertical' ? 'flex' : 'block'
      props.style.listStyle = 'none'
      props.style.padding = '0px'
    } else if (is.component.listItem(blueprint)) {
      // Flipping the position to relative to make the list items stack on top of eachother.
      //    Since the container is a type: list and already has their entire height defined in absolute values,
      //    this shouldn't have any UI issues because they'll stay contained within
      props.style.listStyle = 'none'
      // props.style.padding = 0
    } else if (is.component.popUp(blueprint)) {
      props.style.visibility = 'hidden'
    } else if (
      is.component.scrollView(blueprint) &&
      props.style.display !== 'none'
    ) {
      props.style.display = 'block'
    } else if (is.component.textView(blueprint)) {
      props.style.rows = 10
      props.style.resize = 'none'
    } else if (is.component.video(blueprint)) {
      props.style.objectFit = 'contain'
    }

    /* -------------------------------------------------------
      ---- OTHER / UNCATEGORIZED
    -------------------------------------------------------- */

    // Shadow
    if (is.isBooleanTrue(blueprint?.style?.shadow)) {
      props.style.boxShadow = '5px 5px 10px 3px rgba(0, 0, 0, 0.015)'
      delete props.style.shadow
    }

    // Visibility
    let isHiddenValue = blueprint?.style?.isHidden
    if (is.reference(isHiddenValue)) {
      const isLocal = is.localReference(isHiddenValue)
      isHiddenValue = getByRef(
        isHiddenValue,
        getHelpers({ rootKey: isLocal ? pageName : undefined }),
      )
    }

    is.isBooleanTrue(isHiddenValue) && (props.style.visibility = 'hidden')

    if (is.isBoolean(blueprint?.required)) {
      props.required = is.isBooleanTrue(blueprint?.required)
    }
  } else {
    /**
     * - Referenced components (ex: '.BaseHeader)
     * - Text
     */
    if (u.isStr(blueprint) && is.reference(blueprint)) {
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

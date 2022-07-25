/**
 * TODO - Not being used yet (copied from noodl-ui)
 */
import type { ComponentObject, VpUnit } from 'noodl-types'
import * as fp from './utils/fp'
import {
  excludeIteratorVar,
  normalize,
  getSize,
  getPositionProps,
  getViewportBound,
  getVpKey,
  hasLetter,
  normalize,
  presets,
  trimReference,
} from './utils/noodl'
import coreBuiltIns from './builtIn/core'
import * as is from './utils/is'
import * as c from './constants'
import * as t from './types'

const getBaseStyles = coreBuiltIns.getBaseStyles
const isRef = is.reference
const isLocalRRef = is.localReference
const isRootRef = is.rootReference
const noodlUnit = is.noodlUnit
const { each, entries, get, has, or, set, toNum, toPx, toStr } = fp

/**
 * Retrieves a value from ARoot or an object literal
 * @param root ARoot or a regular object literal
 * @param key Key
 * @returns The retrieved value
 */
function getR(root: Record<string, any> | t.ARoot, key: string[] | string) {
  if (is.root(root)) return root.get(is.arr(key) ? key.join('.') : key)
  return get(root, key)
}

/**
 * Deeply resolves reference strings
 * @param ref Reference string
 * @param options Options
 * @returns The dereferenced value
 */
function getByRef(
  ref = '',
  {
    blueprint,
    context,
    props,
    root,
    rootKey,
    getParent,
  }: {
    blueprint: Partial<ComponentObject>
    context:
      | { dataObject?: any; iteratorVar?: string; listObject?: any }
      | undefined
    props: Record<string, any>
    root: Record<string, any>
    rootKey?: string
    getParent?: any
  },
) {
  // TODO - Resolving traversal references is not working expectedly
  if (is.traverseReference(ref)) {
    if (is.fnc(getParent)) {
      // ['', '', '', '.colorChange']
      let parts = ref.split('_')
      let depth = parts.filter((s) => s === '').reduce((acc) => ++acc, 0)
      let nextKey = parts.shift()

      while (nextKey && !nextKey.startsWith('.')) {
        if (nextKey === '') {
          // continue
        } else if (nextKey.startsWith('.')) {
          const parent = getParent({
            blueprint,
            context: context ?? {},
            props,
            op: 'traverse',
            opArgs: { depth, ref },
          })
          return getR(parent, nextKey[1].slice())
        }

        nextKey = parts.shift()
      }
    }
  }

  let refValue: any

  if (isLocalRRef(ref)) {
    if (rootKey) {
      refValue = refValue = getR(
        getR(root, rootKey),
        fp.path(trimReference(ref)),
      )
    }
  } else if (isRootRef(ref)) refValue = getR(root, trimReference(ref))

  if (is.str(refValue) && isRef(refValue)) {
    const path = fp.path(trimReference(refValue))
    if (isLocalRRef(refValue)) {
      const prevPath = fp.path(trimReference(ref))
      if (prevPath[0] !== rootKey) rootKey = prevPath[0]
    } else {
      if (path[0] !== rootKey) rootKey = path.shift()
    }
    return getByRef(refValue, { ...arguments[1], rootKey })
  }
  return is.und(refValue) ? ref : refValue
}

// const bf = entries(objectBuiltIns).reduce((acc, [key, fn]) => {
//   acc[`=.builtIn.${key}`] = fn
//   return acc
// }, {} as Record<`=.builtIn.${keyof typeof builtInFns}.${keyof typeof builtInFns[keyof typeof builtInFns]}`, any>)

export interface PropsObject {
  [key: string | symbol]: any
}

export interface ParseOptions<Props extends PropsObject = PropsObject> {
  /**
   * Any data needed to render/transform components
   */
  context?: t.NormalizePropsContext
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
    props: PropsObject
    blueprint: Partial<Props>
    context: t.NormalizePropsContext
    op?: 'traverse' | undefined
    opArgs?: Record<string, any>
  }) => any
  getHelpers?: (opts?: Record<string, any>) => {
    props: PropsObject
    getParent?: any
    blueprint: Partial<Props>
    context: t.NormalizePropsContext
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
  viewport?: t.IViewport | { width: number; height: number }
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

function transform<Props extends PropsObject>(
  blueprint: Partial<Props>,
  parseOptions: ParseOptions<Props>,
): any

function transform<Props extends PropsObject>(
  props: PropsObject,
  blueprint: Partial<Props>,
  parseOptions: ParseOptions<Props>,
): any

function transform<Props extends PropsObject>(
  props: PropsObject = { style: {} },
  blueprint: Partial<Props> = {},
  parseOptions: ParseOptions<Props> = {},
) {
  if (is.und(parseOptions)) {
    parseOptions = blueprint as ParseOptions<Props>
    blueprint = props as any
    props = {}
    return transform(props, blueprint, {
      ...parseOptions,
      getHelpers: (opts) => ({
        blueprint,
        context: context ?? {},
        getParent: parseOptions?.getParent,
        props,
        root: parseOptions?.root ?? {},
        rootKey: parseOptions?.pageName ?? '',
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

  if (!is.fnc(getHelpers)) {
    return transform(props, blueprint, {
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

  if (is.obj(blueprint?.style)) {
    each(
      entries(getBaseStyles(blueprint, root)),
      fp.spread((k, v) => set(props, `style.${k}`, v)),
    )
  }

  if (is.obj(blueprint)) {
    set(props, 'type', blueprint.type)

    let iteratorVar = context?.iteratorVar ?? ''

    for (const [originalKey, originalValue] of entries(blueprint)) {
      let value = props?.[originalKey]

      if (originalKey === 'dataKey') {
        if (is.str(originalValue)) {
          let datapath = fp.path(trimReference(originalValue))
          let isLocalKey = is.localKey(datapath.join('.'))
          // Note: This is here for fallback reason
          // dataKey should never be a reference in the noodl
          if (isRef(originalValue)) isLocalKey = isLocalRRef(originalValue)
          const dataValue = getR(
            or(isLocalKey, getR(root, pageName), root),
            datapath,
          )
          set(props, 'data-value', dataValue)
          if (is.select(blueprint)) {
            const dataOptions = or(
              is.str(blueprint.options),
              getR(or(isLocalKey, getR(root, pageName), root), datapath),
              fp.toArr(blueprint.options),
            )
            set(props, 'data-options', dataOptions)
          }
          continue
        }
      } else if (originalKey === 'options') {
        if (is.select(blueprint)) {
          const dataKey = blueprint.dataKey
          const isUsingDataKey = is.str(dataKey) || is.str(originalValue)
          // Receiving their options by reference
          if (isUsingDataKey && !is.arr(originalValue)) {
            let dataPath = is.str(dataKey) ? dataKey : toStr(originalValue)
            let dataObject: any
            let isListPath =
              !!iteratorVar && toStr(dataPath).startsWith(iteratorVar)

            value = or(dataPath, getR(dataObject, dataPath), dataObject)

            if (!is.arr(value)) {
              if (isListPath) {
                dataPath = excludeIteratorVar(dataPath, iteratorVar) ?? ''
                dataObject = context?.dataObject
              } else {
                dataPath = trimReference(dataPath)
                value = getR(
                  or(is.localKey(dataPath), getR(root, pageName), root),
                  dataPath,
                )
              }
            }
          }

          props['data-options'] = value ?? []
          if (!props.options) set(props, 'options', get(props, 'data-options'))
        }
      } else if (originalKey === 'style') {
        // Style keys to be removed (for the DOM) after processing
        const delKeys = [] as string[]
        const markDelete = (v: any) => !delKeys.includes(v) && delKeys.push(v)
        // Values to restore after processing to ensure that they are re-written back if overwritten
        const restoreVals = {} as Record<string, any>

        if (is.obj(originalValue)) {
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
          if (is.str(axis) && /horizontal|vertical/.test(axis)) {
            markDelete('axis')
            if (axis === 'horizontal') {
              fp.assign(value, normalize(['axis', 'horizontal']))
            } else if (axis === 'vertical') {
              fp.assign(value, normalize(['axis', 'vertical']))
            }
          }

          // ALIGN
          if (is.str(align) && /center[xy]/.test(align)) {
            markDelete('align')
            if (align === 'centerX') {
              fp.assign(value, normalize(['align', 'centerX']))
            } else if (align === 'centerY') {
              fp.assign(value, normalize(['align', 'centerY']))
            }
          }

          // TEXTALIGN
          if (textAlign) {
            // "centerX", "centerY", "left", "center", "right"
            if (is.str(textAlign)) {
              if (textAlign === 'left') set(value, 'textAlign', 'left')
              else if (textAlign === 'center') set(value, 'textAlign', 'center')
              else if (textAlign === 'right') set(value, 'textAlign', 'right')
              else if (textAlign === 'centerX') {
                fp.assign(value, normalize(['textAlign', 'centerX']))
                fp.assign(restoreVals, normalize(['textAlign', 'centerX']))
              } else if (textAlign === 'centerY') {
                fp.assign(value, normalize(['textAlign', 'centerY']))
                markDelete('textAlign')
              }
            }
            // { x, y }
            else if (is.obj(textAlign)) {
              if (!is.nil(textAlign.x)) {
                set(
                  value,
                  'textAlign',
                  or(textAlign.x === 'centerX', 'center', textAlign.x),
                )
              }
              if (!is.nil(textAlign.y)) {
                // The y value needs to be handled manually here since getTextAlign will
                //    return { textAlign } which is meant for x
                if (textAlign.y === 'center' || textAlign.y === 'centerY') {
                  let convert = new Map([
                    ['left', 'flex-start'],
                    ['right', 'flex-end'],
                    ['center', 'center'],
                  ])
                  // convert (left ,center ,right) to (flex-start | flex-end | center)
                  const justifyContent = convert.get(
                    textAlign.x ? textAlign.x : 'left',
                  )
                  set(value, 'display', 'flex')
                  set(value, 'alignItems', 'center')
                  set(value, 'justifyContent', justifyContent)
                  if (!textAlign.x) markDelete('textAlign')
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
            if (border == '0') set(value, 'borderStyle', 'none')

            if (is.obj(border)) {
              borderStyle = border.style
              color = border.color
              width = border.width
              line = border.line
            }

            if (color) set(value, 'borderColor', color.replace('0x', '#'))
            if (line) set(value, 'borderStyle', line)
            if (width) set(value, 'borderWidth', width)

            // Analyizing border
            if (borderStyle == '1') {
              fp.assign(value, presets.border['1'])
            } else if (borderStyle == '2') {
              fp.assign(value, presets.border['2'])
            } else if (borderStyle == '3') {
              fp.assign(value, presets.border['3'])
              if (!width) set(value, 'borderWidth', 'thin')
            } else if (borderStyle == '4') {
              fp.assign(value, presets.border['4'])
              if (!width) set(value, 'borderWidth', 'thin')
            } else if (borderStyle == '5') {
              fp.assign(value, presets.border['5'])
            } else if (borderStyle == '6') {
              fp.assign(value, presets.border['6'])
            } else if (borderStyle == '7') {
              fp.assign(value, presets.border['7'])
            }
          }

          if (borderWidth) set(value, 'borderWidth', toPx(borderWidth))

          if (borderRadius) {
            if (noodlUnit(borderRadius)) {
              const vpSize = getSize(borderRadius, toNum(viewport?.height))
              const newBorderRadius = toPx(vpSize)
              set(value, 'borderRadius', newBorderRadius)
            } else {
              if (is.str(borderRadius) || is.num(borderRadius)) {
                set(value, 'borderRadius', toPx(borderRadius))
              }

              // If a borderRadius effect is to be expected and there is no border
              // (since no border negates borderRadius), we need to add an invisible
              // border to simulate the effect
              const regex = /[a-zA-Z]+$/
              const radius = Number(`${borderRadius}`.replace(regex, ''))
              if (!Number.isNaN(radius)) {
                set(value, 'borderRadius', `${radius}px`)
                if (
                  !(is.str(value.border) && value.border) &&
                  is.nullishStyleValue(value.borderWidth)
                ) {
                  // Make the border invisible
                  set(value, 'borderWidth', `1px`)
                  set(value, 'borderColor', 'rgba(0, 0, 0, 0)')
                }
              }
            }
          }

          if (border?.style) markDelete('border')

          /* -------------------------------------------------------
            ---- FONTS
          -------------------------------------------------------- */

          if (!is.und(fontSize)) {
            // '10' --> '10px'
            if (is.str(fontSize)) {
              if (!hasLetter(fontSize)) {
                if (noodlUnit(fontSize)) {
                  const vpSize = toNum(viewport?.height)
                  const newFontSize = getSize(fontSize, vpSize)
                  set(value, 'fontSize', toPx(newFontSize))
                } else set(value, 'fontSize', toPx(fontSize))
              }
            }
            // 10 --> '10px'
            else if (is.num(fontSize)) set(value, 'fontSize', toPx(fontSize))
            if (fontFamily) set(value, 'fontFamily', fontFamily)
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
            each(c.posKeys as any, (posKey) => {
              if (!is.nil(originalValue?.[posKey])) {
                const vpSize = toNum(getViewportBound(viewport, posKey))
                const result = getPositionProps(originalValue, posKey, vpSize)
                if (is.obj(result)) {
                  each(entries(result), fp.spread(fp.partial(set, value)))
                }
              }
            })
            // Remove textAlign if it is an object (NOODL data type is not a valid DOM style attribute)
            if (is.obj(get(value, 'textAlign'))) markDelete('textAlign')
          }

          /* -------------------------------------------------------
            ---- SIZES
          -------------------------------------------------------- */

          const { width, height, maxHeight, maxWidth, minHeight, minWidth } =
            (originalValue ?? {}) as any

          for (const [key, val] of [
            ['width', width],
            ['height', height],
          ]) {
            if (!is.nil(val)) {
              const vpSize = getViewportBound(viewport, key)
              const newValue = getSize(val, toNum(vpSize))
              set(value, key, toStr(newValue))
            }
          }
          for (const [key, vpKey, val] of [
            ['maxHeight', 'height', maxHeight],
            ['minHeight', 'height', minHeight],
            ['maxWidth', 'width', maxWidth],
            ['minWidth', 'width', minWidth],
          ]) {
            if (!is.nil(val)) {
              set(value, key, toStr(getSize(val, viewport?.[vpKey])))
            }
          }
          // HANDLING ARTBITRARY STYLES
          for (let [styleKey, styleValue] of entries(originalValue)) {
            // Unwrap the reference for processing
            if (is.str(styleValue) && isRef(styleValue)) {
              const isLocal = isLocalRRef(styleValue)
              const helpers = getHelpers({ rootKey: or(isLocal, pageName, '') })
              styleValue = getByRef(styleValue, helpers)
            }

            if (is.keyRelatedToWidthOrHeight(styleValue)) {
              const vpSize = getViewportBound(viewport, toStr(styleKey))
              const value = toStr(getSize(styleValue, toNum(vpSize)))
              set(value, styleKey, value)
            }

            if (is.str(styleValue)) {
              while (isRef(styleValue)) {
                const isLocal = isLocalRRef(styleValue)
                const helpers = getHelpers({ rootKey: isLocal ? pageName : '' })
                const newStyleValue = getByRef(styleValue, helpers)
                if (newStyleValue === styleValue) break
                // It will do an infinite loop without this
                if (is.traverseReference(styleValue)) break
                styleValue = newStyleValue
              }

              // Resolve vw/vh units (Values directly relative to viewport)
              if (is.vwVh(styleValue)) {
                if (keepVpUnit) {
                  set(value, styleKey, `calc(${styleValue})`)
                } else {
                  const vpKey = getVpKey(styleValue)
                  const vpVal = viewport?.[vpKey as VpUnit]
                  const valueNum = toNum(styleValue) / 100
                  if (is.nil(vpVal)) set(value, styleKey, styleValue)
                  else set(value, styleKey, toPx(getSize(valueNum, vpVal)))
                }
              }

              // Cache this value to the variable so it doesn't get mutated inside this func since there are moments when value is changing before this func ends
              // If the value is a path of a list item data object
              const isListPath =
                iteratorVar && toStr(styleValue).startsWith(iteratorVar)

              // '2.8vh', '20px', etc
              const isSizeValue =
                is.vwVh(styleValue) ||
                is.keyRelatedToWidthOrHeight(styleKey) ||
                ['fontSize', 'borderRadius', 'borderWidth'].includes(
                  toStr(styleKey),
                )

              if (isSizeValue) {
                if (viewport) {
                  if (is.vwVh(styleValue)) {
                    const valueNum = toNum(styleValue) / 100
                    const vpSize = getViewportBound(viewport, styleValue)
                    const vwVhValue = getSize(valueNum, toNum(vpSize))
                    set(
                      value,
                      styleKey,
                      keepVpUnit ? `calc(${styleValue})` : toStr(vwVhValue),
                    )
                  } else if (is.keyRelatedToWidthOrHeight(styleKey)) {
                    const vpSize = getViewportBound(viewport, styleKey)
                    const computedValue = noodlUnit(styleValue)
                      ? toStr(getSize(styleValue, toNum(vpSize)))
                      : ''
                    if (noodlUnit(styleValue)) {
                      set(value, styleKey, computedValue)
                    } else if (is.keyRelatedToHeight(styleKey)) {
                      if (styleKey == 'borderRadius' && is.str(styleValue)) {
                        if (styleValue.includes('px')) {
                          set(value, styleKey, styleValue)
                        } else {
                          set(value, styleKey, toPx(styleValue))
                        }
                      }
                    }
                  }
                }
              } else {
                set(value, styleKey, normalize(styleValue))
              }

              if (styleKey == 'pointerEvents' && styleValue != 'none') {
                markDelete('pointerEvents')
              }

              if (styleKey == 'isHidden' && is.boolTrue(styleValue)) {
                set(props, 'style.visibility', 'hidden')
              }

              // TODO - Find out how to resolve the issue of "value" being undefined without this string check when we already checked above this
              if (
                is.str(styleValue) &&
                (styleKey === 'textColor' ||
                  styleValue.startsWith('0x') ||
                  isListPath)
              ) {
                /* -------------------------------------------------------
                    ---- COLORS - REMINDER: Convert color values like 0x00000000 to #00000000
                  -------------------------------------------------------- */
                if (styleKey === 'textColor') {
                  set(value, 'color', normalize(styleValue))
                  markDelete('textColor')
                } else {
                  // Some list item consumers have data keys referencing color data values
                  // They are in the 0x0000000 form so we must convert them to be DOM compatible

                  if (isListPath) {
                    const dataObject = context?.dataObject
                    if (is.obj(dataObject)) {
                      const dataKey = excludeIteratorVar(
                        styleValue,
                        iteratorVar,
                      )

                      const _styleValue = normalize(getR(dataObject, dataKey))

                      if (is.keyRelatedToWidthOrHeight(styleKey)) {
                        if (noodlUnit(_styleValue)) {
                          const vpSize = getViewportBound(viewport, styleKey)
                          const newValue = getSize(_styleValue, toNum(vpSize))
                          set(value, styleKey, toStr(newValue))
                        }
                      } else if (styleKey === 'pointerEvents') {
                        set(value, 'pointer-events', _styleValue)
                      } else {
                        set(value, styleKey, _styleValue)
                      }
                    } else {
                      set(value, styleKey, normalize(toStr(dataObject)))
                    }
                  }

                  if (is.str(styleValue) && styleValue.startsWith('0x')) {
                    set(value, styleKey, normalize(styleValue))
                  }
                }
              }
            }
          }
        } else if (is.str(originalValue)) {
          // Unparsed style value (reference)
        }
        each(delKeys, (key) => delete value[key])
        each(entries(restoreVals), fp.spread(fp.partial(set, value)))
      } else if (originalKey === 'viewTag') {
        let dataView = value
        if (isRef(value)) {
          const rootKey = isLocalRRef(value) ? pageName : ''
          const helpers = getHelpers({ rootKey })
          dataView = getByRef(value, helpers)
        }
        set(props, 'data-view', dataView)
      } else {
        // Arbitrary references
        if (is.str(originalValue) && isRef(originalValue)) {
          value = getByRef(originalValue, getHelpers({ rootKey: pageName }))
          set(props, originalKey, value)
        }
      }
    }

    /* -------------------------------------------------------
      ---- COMPONENTS
    -------------------------------------------------------- */

    if (is.header(blueprint)) {
      set(props, 'style.zIndex', 100)
    } else if (is.image(blueprint)) {
      // Remove the height to maintain the aspect ratio since images are
      // assumed to have an object-fit of 'contain'
      if (!has(blueprint.style, 'height')) delete props.style.height
      // Remove the width to maintain the aspect ratio since images are
      // assumed to have an object-fit of 'contain'
      if (!has(blueprint.style, 'width')) delete props.style.width
      if (!has(blueprint.style, 'objectFit')) {
        set(props.style, 'objectFit', 'contain')
      }
    } else if (is.listLike(blueprint) && props.style.display !== 'none') {
      let axis = blueprint.style?.axis
      let display = 'block'
      if (axis === 'horizontal' ?? axis === 'vertical') display = 'flex'
      set(props, 'style.display', display)
      set(props, 'style.listStyle', 'none')
      set(props, 'style.padding', '0px')
    } else if (is.listItem(blueprint)) {
      // Flipping the position to relative to make the list items stack on top of eachother.
      //    Since the container is a type: list and already has their entire height defined in absolute values,
      //    this shouldn't have any UI issues because they'll stay contained within
      set(props, 'style.listStyle', 'none')
      // props.style.padding = 0
    } else if (is.popUp(blueprint)) {
      set(props, 'style.visibility', 'hidden')
    } else if (is.scrollView(blueprint) && props.style.display !== 'none') {
      set(props, 'style.display', 'block')
    } else if (is.textView(blueprint)) {
      set(props, 'style.rows', 10)
      set(props, 'style.resize', 'none')
    } else if (is.video(blueprint)) {
      set(props, 'style.objectFit', 'contain')
    }

    /* -------------------------------------------------------
      ---- OTHER / UNCATEGORIZED
    -------------------------------------------------------- */

    // Shadow
    if (is.boolTrue(blueprint?.style?.shadow)) {
      set(props, 'style.boxShadow', normalize('shadow'))
      delete props.style.shadow
    }

    // Visibility
    let isHiddenValue = blueprint?.style?.isHidden
    if (isRef(isHiddenValue)) {
      const isLocal = isLocalRRef(isHiddenValue)
      const helpers = getHelpers({ rootKey: isLocal ? pageName : '' })
      isHiddenValue = getByRef(isHiddenValue, helpers)
    }

    is.boolTrue(isHiddenValue) && set(props, 'style.visibility', 'hidden')

    if (is.bool(blueprint?.required)) {
      set(props, 'required', is.boolTrue(blueprint?.required))
    }
  } else {
    /**
     * - Referenced components (ex: '.BaseHeader)
     * - Text
     */
    if (is.str(blueprint) && isRef(blueprint)) {
      const rootKey = isLocalRRef(blueprint) ? pageName : ''
      const helpers = getHelpers({ rootKey })
      return transform(props, getByRef(blueprint, helpers))
    } else {
      console.log({ SEE_WHAT_THIS_IS: blueprint })
    }
  }

  return props
}

export default transform

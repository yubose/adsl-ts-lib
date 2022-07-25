export interface StyleObject {
  /**
   * Alignment
   * @example
   * ```json
   * { "align": "horizontal"}
   * { "align": "vertical"}
   * ```
   */
  align?: StyleAlign
  /**
   * Axis
   * @example
   * ```json
   * { "axis": "centerX" }
   * { "axis": "centerY" }
   * ```
   */
  axis?: StyleAxis
  background?: string
  /**
   * @example
   * ```json
   * { "backgroundColor": "0.1" }
   * ```
   */
  backgroundColor?: string
  /**
   * @example
   * ```json
   * { "border": "0" }
   * { "border": "1" }
   * { "border": "2" }
   * { "border": "3" }
   * { "border": "4" }
   * { "border": "5" }
   * { "border": "6" }
   * { "border": "7" }
   * ```
   */
  border?: StyleBorderObject
  /**
   * @example
   * ```json
   * { "borderColor": "0x334455" }
   * ```
   */
  borderColor?: string
  /**
   * @example
   * ```json
   * { "borderRadius": "0.125" }
   * ```
   */
  borderRadius?: string
  /**
   * @example
   * ```json
   * { "borderWidth": "0.15" }
   * ```
   */
  borderWidth?: string
  boxShadow?: string
  boxSizing?: string
  /**
   * @example
   * ```json
   * { "color": "0x993344" }
   * ```
   */
  color?: string
  contentSize?: {
    width?: string
    height?: string
  }
  /**
   * @example
   * ```json
   * { "display": "inline" }
   * { "display": "inline-block" }
   * ```
   */
  display?: string
  float?: boolean
  flex?: string
  flexFlow?: any
  /**
   * @example
   * ```json
   * { "fontColor": "0x223344" }
   * ```
   */
  fontColor?: string
  fontSize?: string
  fontFamily?: string
  /**
   * @example
   * ```json
   * { "fontStyle": "bold" }
   * ```
   */
  fontStyle?: string | 'bold'
  fontWeight?: string
  /**
   * @example
   * ```json
   * { "height": "0.23" }
   * { "height": "1" }
   * ```
   */
  height?: string
  /**
   * @example
   * ```json
   * { "isHidden": "true" }
   * ```
   */
  isHidden?: boolean | string
  justifyContent?: string
  /**
   * @example
   * ```json
   * { "left": "0.5" }
   * ```
   */
  left?: string
  letterSpacing?: string
  lineHeight?: string
  /**
   * @example
   * ```json
   * { "marginLeft": "0.23" }
   * ```
   */
  marginLeft?: string
  /**
   * @example
   * ```json
   * { "marginTop": "0.23" }
   * ```
   */
  marginTop?: string
  /**
   * @example
   * ```json
   * { "marginRight": "0.23" }
   * ```
   */
  marginRight?: string
  /**
   * @example
   * ```json
   * { "marginBottom": "0.23" }
   * ```
   */
  marginBottom?: string
  /**
   * @example
   * ```json
   * { "minWidth": "0.1" }
   * ```
   */
  minWidth?: string
  /**
   * @example
   * ```json
   * { "maxWidth": "0.1" }
   * ```
   */
  maxWidth?: string
  /**
   * @example
   * ```json
   * { "minHeight": "0.1" }
   * ```
   */
  minHeight?: string
  /**
   * @example
   * ```json
   * { "maxHeight": "0.1" }
   * ```
   */
  maxHeight?: string
  outline?: string
  padding?: string
  /**
   * @example
   * ```json
   * { "paddingTop": "0.1" }
   * ```
   */
  paddingTop?: string
  /**
   * @example
   * ```json
   * { "paddingLeft": "0.1" }
   * ```
   */
  paddingLeft?: string
  /**
   * @example
   * ```json
   * { "paddingRight": "0.1" }
   * ```
   */
  paddingRight?: string
  /**
   * @example
   * ```json
   * { "paddingBottom": "0.1" }
   * ```
   */
  paddingBottom?: string
  /**
   * @example
   * ```json
   * { "position": "relative" }
   * { "position": "absolute" }
   * ```
   */
  position?: string
  /**
   * @example
   * ```json
   * { "required": "true" }
   * { "required": true }
   * ```
   */
  required?: string | boolean
  /**
   * @example
   * ```json
   * { "shadow": "true" }
   * { "shadow": true }
   * ```
   */
  shadow?: false | string // ex: "false"
  /**
   * @example
   * ```json
   * { "textAlign": "left" }
   * { "textAlign": "center" }
   * { "textAlign": "centerX" }
   * { "textAlign": "right" }
   * { "textAlign": { "x": "left" } }
   * { "textAlign": { "x": "center" } }
   * { "textAlign": { "x": "centerX" } }
   * { "textAlign": { "x": "right" } }
   * { "textAlign": { "y": "center" } }
   * { "textAlign": { "x": "centerX", "y": "center" } }
   * ```
   */
  textAlign?: StyleTextAlign
  /**
   * @example
   * ```json
   * { "textColor": "0x003344" }
   * ```
   */
  textColor?: string
  textDecoration?: string
  textIndent?: string
  /**
   * @example
   * ```json
   * { "top": "0.1" }
   * ```
   */
  top?: string
  /**
   * @example
   * ```json
   * { "width": "0.1" }
   * ```
   */
  width?: string
  /**
   * @example
   * ```json
   * { "zIndex": "1000" }
   * ```
   */
  zIndex?: number | string
  [key: string]: any
}

export type StyleAlign = 'centerX' | 'centerY'

export type StyleAxis = 'horizontal' | 'vertical'

export interface StyleBorderObject {
  style?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | 1 | 2 | 3 | 4 | 5 | 6 | 7
  width?: number | string
  color?: number | string
  line?: string // ex: "solid"
  [key: string]: any
}

export type StyleTextAlign =
  | StyleAlign
  | StyleTextAlignObject
  | 'center'
  | 'left'
  | 'right'

export interface StyleTextAlignObject {
  x?: 'center' | 'centerX' | 'left' | 'right'
  y?: 'center' | 'centerY' | 'left' | 'right'
}

export type VpUnit = 'vh' | 'vw'
export type VpValue = `${string}${VpUnit}`

export type KnownStyleKeys =
  | 'align'
  | 'axis'
  | 'background'
  | 'backgroundColor'
  | 'border'
  | 'borderColor'
  | 'borderRadius'
  | 'borderWidth'
  | 'boxShadow'
  | 'boxSizing'
  | 'color'
  | 'contentSize'
  | 'display'
  | 'flex'
  | 'flexFlow'
  | 'float'
  | 'fontColor'
  | 'fontFamily'
  | 'fontSize'
  | 'fontStyle'
  | 'fontWeight'
  | 'height'
  | 'isHidden'
  | 'justifyContent'
  | 'left'
  | 'letterSpacing'
  | 'lineHeight'
  | 'marginBottom'
  | 'marginLeft'
  | 'marginRight'
  | 'marginTop'
  | 'maxHeight'
  | 'maxWidth'
  | 'minHeight'
  | 'minWidth'
  | 'outline'
  | 'padding'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'paddingRight'
  | 'paddingTop'
  | 'position'
  | 'required'
  | 'shadow'
  | 'textAlign'
  | 'textColor'
  | 'textDecoration'
  | 'textIndent'
  | 'top'
  | 'width'
  | 'zIndex'

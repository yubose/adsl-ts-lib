import * as u from '@jsmanifest/utils'
import { hasLetter, hasDecimal } from './utils/common'

const isNil = (f: any) => u.isNull(f) || u.isUnd(f)

interface GetSizeOptions<U extends 'px' | 'noodl' = 'px' | 'noodl'> {
  toFixed?: number
  unit?: U
}

class NOODLViewport {
  #onResize = {} as () => void

  width: number = undefined as any
  height: number = undefined as any

  /**
   * Returns an object with width and height, computed by apply the min/max values for the aspect ratio
   * @param { number | undefined } width - Defaults to window.innerWidth
   * @param { number | undefined } height - Defaults to window.innerHeight
   * @param { number } min - Minimum aspect ratio for width
   * @param { number } max - Maximum aspect ratio for height
   * @param { number } aspectRatio - Defaults to the aspect ratio of window.innerWidth and window.innerHeight
   */
  static applyMinMax({
    width,
    height,
    ...rest
  }: {
    width: number
    height: number
    min: number
    max: number
    aspectRatio: number
  }) {
    if (isNil(width) || isNil(height)) {
      width = innerWidth
      height = innerHeight
    }
    if (rest.aspectRatio < rest.min) width = rest.min * height
    else if (rest.aspectRatio > rest.max) width = rest.max * height
    return { width, height }
  }

  /**
   * Returns the aspect ratio relative to the width and height. Defaults to window.innerWidth
   * and window.innerHeight
   * @param { number | undefined } width - Defaults to window.innerWidth
   * @param { number | undefined } height - Defaults to window.innerHeight
   */
  static getAspectRatio(width: number, height: number) {
    if (isNil(width) || isNil(height)) {
      width = innerWidth
      height = innerHeight
    }
    /**
     * The binary Great Common Divisor calculator
     * https://stackoverflow.com/questions/1186414/whats-the-algorithm-to-calculate-aspect-ratio
     * @param { number } u - Upper
     * @param { number } v - Lower
     */
    const getGCD = (u: number, v: number): any => {
      if (u === v) return u
      if (u === 0) return v
      if (v === 0) return u
      if (~u & 1)
        if (v & 1) return getGCD(u >> 1, v)
        else return getGCD(u >> 1, v >> 1) << 1
      if (~v & 1) return getGCD(u, v >> 1)
      if (u > v) return getGCD((u - v) >> 1, v)
      return getGCD((v - u) >> 1, u)
    }
    const gcd = getGCD(width, height)
    const newWidth = width / gcd
    const newHeight = height / gcd
    const aspectRatio = newWidth / newHeight
    return aspectRatio
  }

  /**
   * Returns the computed size.
   * @param { string | number } value - Size in decimals as written in NOODL
   * @param { number } vpSize - The maximum width (or height)
   */
  static getSize(
    value: string | number,
    vpSize: number,
    { toFixed = 2, unit }: GetSizeOptions = {},
  ) {
    let result: any
    if (value == '0') {
      result = 0
    } else if (value == '1') {
      result = Number(vpSize)
    } else {
      if (u.isStr(value)) {
        if (!hasLetter(value)) {
          result = Number(value) * vpSize
        } else {
          result = value.replace(/[a-zA-Z]+/gi, '')
        }
      } else if (u.isNum(value)) {
        if (hasDecimal(value)) {
          result = value * vpSize
        } else {
          result = value
        }
        result = value * vpSize
      }
    }
    if (isNil(result)) return result
    switch (unit) {
      // NOODL
      case 'noodl':
        return (Number(result) / vpSize).toFixed(toFixed)
      // Transformed
      case 'px':
        return `${Number(result).toFixed(toFixed)}px`
      default:
        // TODO - Wrap to coerce to number type
        return Number(result).toFixed(toFixed)
    }
  }

  /**
   * Returns true if the value is considered an "invalid" data value to set on
   * a viewport's dimensions. This is mostly intended to trigger the auto-top
   * concept. Invalid values are: null, undefined, '', 'auto
   * @param { unknown } value
   */
  static isNil(v: unknown, unit?: string): v is null | undefined | '' | 'auto' {
    return (
      v === null || u.isUnd(v) || v === 'auto' || v === '' || v === `0${unit}`
    )
  }

  /**
   * Returns true if the value is a NOODL value that the Viewport will treat as
   * "not yet transformed/parsed". The Viewport sees a NOODL value as a value
   * that is a string, does not have any letters, and is coercible to a number
   * @param { unknown } value
   */
  static isNoodlUnit(v: unknown): v is string {
    return u.isStr(v) && !/[a-zA-Z]/i.test(v) && !Number.isNaN(Number(v))
  }

  /** https://tc39.es/ecma262/#sec-tonumber */
  static toNum(v: unknown) {
    if (u.isNum(v)) return v
    else if (u.isStr(v)) return Number(v.replace(/[a-zA-Z]/gi, ''))
    return Number(String(v))
  }

  constructor({ width, height }: { width?: number; height?: number } = {}) {
    this.width = width as number
    this.height = height as number
  }

  isValid() {
    return this.width !== null && this.height !== null
  }

  get onResize() {
    return this.#onResize
  }

  set onResize(
    callback: (
      viewport: { width: number; height: number } & {
        previousWidth: number | undefined
        previousHeight: number | undefined
      },
    ) => Promise<any> | any,
  ) {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent || window.navigator.vendor
      window.removeEventListener('resize', this.#onResize)

      this.#onResize = () => {
        const previousWidth = this.width
        const previousHeight = this.height
        this.width = window.innerWidth
        this.height = window.innerHeight

        callback({
          width: this.width,
          height: this.height,
          previousWidth,
          previousHeight,
        })
      } 
      const trulyWindowWidth = window.screen.width;
      const trulyWindowHeight = window.screen.height;
      const onUnload = (e: Event) => {
        // window.removeEventListener('gesturestart', this.#onResize)
        // window.removeEventListener('gestureend', this.#onResize)
        // window.removeEventListener('gesturechange', this.#onResize)
        window.removeEventListener('resize', this.#onResize)
        window.removeEventListener('unload', onUnload)
      }

      if (typeof window !== 'undefined') {
        // window.addEventListener('gesturestart', this.#onResize)
        // window.addEventListener('gestureend', this.#onResize)
        // window.addEventListener('gesturechange', this.#onResize)
        window.addEventListener('resize', this.#onResize)
        window.addEventListener('unload', onUnload)
      }
      if (/android/i.test(userAgent)) {
        window.removeEventListener('resize', this.#onResize)
        window.removeEventListener('unload', onUnload)
      }
      if(trulyWindowWidth < trulyWindowHeight) {
        //like phone browser but set UA as desktop
        window.removeEventListener('resize', this.#onResize)
        window.removeEventListener('unload', onUnload)
      }
    }
  }

  getWidth(dec: string, rest?: Parameters<typeof NOODLViewport['getSize']>[2]) {
    return NOODLViewport.getSize(dec, this.width, rest as any)
  }

  getHeight(
    dec: string,
    rest?: Parameters<typeof NOODLViewport['getSize']>[2],
  ) {
    return NOODLViewport.getSize(dec, this.height, rest as any)
  }
}

export default NOODLViewport

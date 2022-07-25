import * as regex from './utils/regex'
import * as t from './types'

class Builder {
  #data: any
  #iterator: t.AIterator<any> | null = null
  #root: t.ARoot | null = null
  #visitor: t.AVisitor | null = null

  set data(data) {
    this.#data = data || this.#root?.value
  }

  get data() {
    return this.#data
  }

  get iterator() {
    return this.#iterator
  }

  get visitor() {
    return this.#visitor
  }

  get root() {
    return this.#root
  }

  /**
   * TODO - Extend
   * @param helpers
   * @returns
   */
  createHelpers<H extends Record<string, any> = Record<string, any>>(
    helpers?: H,
  ) {
    const h = {
      isValidPageValue: (page: string) => {
        if (!page) return false
        if (!regex.letters.test(page)) return false
        if (/null|undefined/i.test(page)) return false
        if (['.', '_', '-'].some((symb) => symb === page)) return false
        return true
      },
      isValidViewTag(viewTag: unknown) {
        if (typeof viewTag === 'string') {
          return !!(viewTag && regex.letters.test(viewTag))
        }
        return false
      },
      ...helpers,
    }
    return h as H & typeof h
  }

  /**
   * TODO - Extend
   * @param data
   * @returns
   */
  createData(data?: any) {
    return data
  }

  /**
   * TODO - Extend
   * @param props
   * @returns
   */
  createProps<
    N = unknown,
    H extends Record<string, any> = Record<string, any>,
  >(opts: { name: string; node: N; helpers?: H }) {
    return { ...opts }
  }

  use(value: t.AIterator<any> | t.ARoot | t.AVisitor) {
    if (value instanceof t.AIterator) {
      this.#iterator = value
    } else if (value instanceof t.ARoot) {
      this.#root = value
    } else if (value instanceof t.AVisitor) {
      this.#visitor = value
    }
    return this
  }
}

export default Builder

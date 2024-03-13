import type * as nt from 'noodl-types'

const otherObjectsFactory = (function otherObjectsFactory() {
  function override(key: string): { [rootKey: `=..${string}@`]: '' }
  function override(
    rootKey: string,
    key: string,
    value: any,
  ): { [rootKey: `=.${string}@`]: any }
  function override(
    key: string,
    value: any,
  ): { [rootKey: `=..${string}@`]: any }
  function override(...args: any[]) {
    if (args.length === 3) {
      return { [`.${args[0]}.${args[1]}@`]: args[2] }
    } else {
      return { [`..${args[0]}@`]: args.length === 1 ? '' : args[1] }
    }
  }

  function page(defaultValues?: Partial<nt.PageObject> | null) {
    const pageObject = {} as nt.PageObject & Record<string, any>

    if (defaultValues !== null && typeof defaultValues === 'object') {
      Object.assign(pageObject, defaultValues)
    }

    if (!pageObject.components) pageObject.components = []
    if (!pageObject.init) pageObject.init = []

    return pageObject
  }

  return {
    override,
    page,
    uidLike: (...values: string[]) => {
      return [
        "uid like '%",
        ...values.reduce(
          (acc, str, i) => (i === 0 ? acc.concat(str) : acc.concat(' ', str)),
          [] as string[],
        ),
        "'",
      ] as ["uid like '%", ...string[], "'"]
    },
  }
})()

export default otherObjectsFactory

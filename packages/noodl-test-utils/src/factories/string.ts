const stringFactory = (function () {
  const ref = (function () {
    function _eval(rootKey: string, path?: string): `=.${string}`
    function _eval(path: string): `=..${string}`
    function _eval(rootKeyOrPath: string, path?: string) {
      if (arguments.length === 2) return `=.${rootKeyOrPath}.${path}`
      return `=..${rootKeyOrPath}`
    }

    function _inherit(rootKey: string, path?: string): `.${string}`
    function _inherit(path: string): `..${string}`
    function _inherit(...args: any[]) {
      if (args.length === 2) return `.${args[0]}.${args[1]}`
      return `..${args[0]}`
    }

    const o = {
      eval: _eval,
      inherit: _inherit,
      override: (str: string) => {
        return (str.endsWith('@') ? str : `${str}@`) as `${string}@`
      },
    }

    return o
  })()

  const o = {
    ref,
    uidLike: (...values: string[]) => {
      return [
        "uid like '%",
        ...values.reduce(
          (acc, str, i) => (i === 0 ? acc.concat(str) : acc.concat(' ', str)),
          [] as string[],
        ),
        "'",
      ]
    },
  }

  return o
})()

export default stringFactory

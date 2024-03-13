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

    function _override(rootKeyOrPath: string, path?: string) {
      let result = `${rootKeyOrPath}`
      if (typeof path === 'string') {
        result += `.${path}`
      }
      if (!result.endsWith('@')) result += '@'
      return result as `${string}@`
    }

    const o = {
      eval: _eval,
      inherit: _inherit,
      override: _override,
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
      ].join('') as `uid like '%${string}'`
    },
  }

  return o
})()

export default stringFactory

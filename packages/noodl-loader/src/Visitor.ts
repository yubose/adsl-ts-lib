import * as u from '@jsmanifest/utils'

export interface VisitorFn {
  (
    key: number | string | null,
    value: unknown,
    parent: any[] | Record<string, any> | null,
  ): any
}

/**
 * Untested / Not confirmed to be stable
 */
const Visitor = (function () {
  const createVisitor = (fn: VisitorFn) => {
    function visit(
      fn: VisitorFn,
      value: unknown,
      parent: any[] | Record<string, any> | null,
    ) {
      let results = [] as any[]

      if (u.isArr(value)) {
        results = results.concat(
          value.reduce((acc, val, index) => {
            const result = fn(index, val, value)
            if (!u.isUnd(result)) acc.push(result)
            acc.push(...visit(fn, val, value))
            return acc
          }, []),
        )
      } else if (u.isObj(value)) {
        for (const [key, val] of u.entries(value)) {
          const result = fn(key, val, value)
          if (!u.isUnd(result)) results.push(result)
          results.push(...visit(fn, val, value))
        }
      } else {
        const result = fn(null, value, parent)
        if (!u.isUnd(result)) results.push(result)
      }

      return results
    }

    return (value: unknown) => {
      return visit(fn, value, null)
    }
  }

  const o = {
    createVisitor,
  }

  return o
})()

export default Visitor

function _visit(obj, callback) {
  //
}

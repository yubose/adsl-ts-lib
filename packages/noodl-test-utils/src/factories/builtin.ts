import type {
  BuiltInDataInDataOutObject,
  BuiltInEmptyObject,
} from 'noodl-types'

const builtInFactory = (function () {
  function createBuiltInObject(path: string): BuiltInEmptyObject
  function createBuiltInObject(
    path: string,
    dataIn: any,
    dataOut?: string,
  ): BuiltInDataInDataOutObject
  function createBuiltInObject(...args: any[]) {
    let path = args[0]

    if (!path.startsWith('=.builtIn')) {
      path = `=.builtIn${(path ? '.' : '') + path || ''}`
    }

    if (args.length === 2) {
      return { [path]: { dataIn: args[1] } }
    } else if (args.length > 2) {
      return { [path]: { dataIn: args[1], dataOut: args[2] } }
    }

    return { [path]: '' }
  }

  return createBuiltInObject
})()

export default builtInFactory

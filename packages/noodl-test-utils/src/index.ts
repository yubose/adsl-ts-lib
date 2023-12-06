import actionFactory from './factories/action'
import builtInFactory from './factories/builtin'
import componentFactory from './factories/component'
import styleFactory from './factories/style'

export * from './types'
export { actionFactory, componentFactory, styleFactory }

export default {
  ...actionFactory,
  ...componentFactory,
  builtIn: builtInFactory,
  style: styleFactory,
}

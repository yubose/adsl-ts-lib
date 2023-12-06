import actionFactory from './factories/action'
import builtInFactory from './factories/builtin'
import componentFactory from './factories/component'
import otherObjectsFactory from './factories/other'
import styleFactory from './factories/style'

export * from './types'
export { actionFactory, componentFactory, styleFactory }

export default {
  ...actionFactory,
  ...componentFactory,
  ...otherObjectsFactory,
  builtIn: builtInFactory,
  style: styleFactory,
}

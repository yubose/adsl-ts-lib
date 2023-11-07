import actionFactory from './factories/action'
import componentFactory from './factories/component'
import styleFactory from './factories/style'

export * from './types'
export { actionFactory, componentFactory, styleFactory }

export default {
  ...actionFactory,
  ...componentFactory,
  style: styleFactory,
}

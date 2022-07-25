import actionFactory from './factories/action'
import componentFactory from './factories/component'

export * from './types'
export { actionFactory, componentFactory }

export default {
  ...actionFactory,
  ...componentFactory,
}

import actionFactory from './factories/action'
import componentFactory from './factories/component'

export * from './types'
export { default as builder } from './builder'
export { actionFactory, componentFactory }

export default {
  ...actionFactory,
  ...componentFactory,
}

/**
 * A component factory work-in-progress (WIP)
 *
 * This is created to achieve and accomplice complex functionality
 * for components (such as ComponentPage for page components)
 *
 * However this is planned to spawn other critical instances like the
 * SignaturePad for the signature functionality
 */
import ComponentPage from './ComponentPage'

const componentFactory = (function () {
  return {
    createComponentPage(...args: ConstructorParameters<typeof ComponentPage>) {
      return new ComponentPage(...args)
    },
  }
})()

export default componentFactory

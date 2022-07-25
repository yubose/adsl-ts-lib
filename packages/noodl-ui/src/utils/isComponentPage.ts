import { ComponentPage } from '../dom/factory/componentFactory'
import isNDOMPage from './isPage'

function isComponentPage(value: any): value is ComponentPage {
  return isNDOMPage(value) && 'window' in value && 'configure' in value
}

export default isComponentPage

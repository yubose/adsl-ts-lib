import NDOMPage from '../dom/Page'

function isNDOMPage(value: any): value is NDOMPage {
  return !!(value && typeof value === 'object' && 'getNuiPage' in value)
}

export default isNDOMPage

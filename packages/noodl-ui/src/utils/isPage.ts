import type NUIPage from '../Page'

function isNuiPage(value: unknown): value is NUIPage {
  return !!(
    value &&
    typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value, 'created')
  )
}

export default isNuiPage

import type Viewport from '../Viewport'

function isViewport(value: any): value is Viewport {
  if (
    value &&
    typeof value === 'object' &&
    'getWidth' in value &&
    'getHeight' in value &&
    'onResize' in value
  ) {
    return true
  }
  return false
}

export default isViewport

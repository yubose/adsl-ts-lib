import { getElementTag } from '../dom/utils'
import type { NuiComponent } from '../types'

function createElement(
  component: NuiComponent.Instance | NuiComponent.Type | undefined,
) {
  return document.createElement(
    (component && getElementTag(component)) || 'div',
  )
}

export default createElement

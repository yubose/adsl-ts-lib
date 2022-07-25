import type { NuiComponent } from '../types'

function isComponent(component: unknown): component is NuiComponent.Instance {
  return typeof component === 'object' && 'blueprint' in (component || {})
}

export default isComponent

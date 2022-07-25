import * as u from '@jsmanifest/utils'
import type { ComponentObject } from 'noodl-types'
import type { NuiComponentType } from '../types'
import isComponent from './isComponent'
import Component from '../Component'

export interface PropsOptionFunc<T> {
  (child: T): Partial<PropsOptionObj>
}
export type PropsOptionObj = ComponentObject & { id?: string }

interface Options {
  path?: string
  props?: PropsOptionObj | PropsOptionFunc<Component>
}

/**
 * A helper/utility to create Component instances corresponding to their NOODL
 * component type
 * @param { string | object | Component } component - NOODL component type, a component object, or a Component instance
 * @param { object | function | undefined } props = Component args passed to the constructor
 */
function createComponent<K extends NuiComponentType = NuiComponentType>(
  type: K,
  options?: Options,
): Component

function createComponent<K extends NuiComponentType = NuiComponentType>(
  value: PropsOptionObj,
  options?: Options,
): Component

function createComponent<K extends NuiComponentType = NuiComponentType>(
  component: Component,
  options?: Options,
): Component

function createComponent<K extends NuiComponentType = NuiComponentType>(
  value: K | PropsOptionObj | Component,
  options?: Options,
): Component {
  let childComponent: any
  const props = toProps(value, options?.props)
  if (typeof value === 'string') {
    childComponent = new Component({ type: value, ...props })
  } else if (isComponent(value)) {
    childComponent = value
    if (props && u.isObj(props)) value.edit(props)
  } else {
    childComponent = new Component({ ...value, ...props })
  }
  return childComponent
}

function toProps(
  value: any,
  props?: Options['props'],
): Partial<PropsOptionObj> | void {
  if (props) {
    if (typeof props === 'function') return props(value)
    return props
  }
}

export default createComponent

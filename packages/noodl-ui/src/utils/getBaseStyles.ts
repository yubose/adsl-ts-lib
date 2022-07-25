import * as u from '@jsmanifest/utils'
import merge from 'lodash/merge'
import type { ComponentObject, StyleObject } from 'noodl-types'

/**
 * Merges in styles using a component and the root object.
 * The order of precedence for collisions is component > base styles
 * @param component Component object
 * @param root Root object
 * @returns Style object
 */
function getBaseStyles(
  component: Partial<ComponentObject> | null | undefined,
  root?: Record<string, any>,
) {
  const origStyle = component?.style || {}
  const styles = { ...origStyle }

  if (u.isNil(origStyle.top) || origStyle.top == 'auto') {
    styles.position = 'relative'
  } else {
    styles.position = 'absolute'
  }

  if (origStyle.position === 'fixed') styles.position = 'fixed'
  if (u.isNil(origStyle.height)) styles.height = 'auto'

  return merge(
    { ...root?.Style, position: 'absolute', outline: 'none' },
    origStyle,
    styles,
  ) as StyleObject
}

export default getBaseStyles

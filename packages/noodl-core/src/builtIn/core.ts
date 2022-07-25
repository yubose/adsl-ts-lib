// Not used yet
import type { StyleObject } from 'noodl-types'
import * as is from '../utils/is'

const core = {
  /**
   * Merges in styles using an obj and the root object.
   * The order of precedence for collisions is obj > base (root)
   *
   * @param obj Current object
   * @param root Root (base) object
   * @returns The merged object (intended as a styles object)
   */
  getBaseStyles(
    obj: Partial<Record<string, any>> | null | undefined,
    root?: Record<string, any>,
  ) {
    const origStyle = obj?.style || {}
    const styles = { ...origStyle }

    styles.position = origStyle.top

    if (is.nil(origStyle.top) || origStyle.top == 'auto') {
      styles.position = 'relative'
    } else {
      styles.position = 'absolute'
    }

    if (origStyle.position === 'fixed') styles.position = 'fixed'
    if (is.nil(origStyle.height)) styles.height = 'auto'

    return {
      ...root?.Style,
      position: 'absolute',
      outline: 'none',
      ...origStyle,
      ...styles,
    } as StyleObject
  },
}

export default core

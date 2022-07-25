import * as u from '@jsmanifest/utils'
import copyStyles from './copyStyles'

/**
 * Copies the attributes of a DOM element including non-readonly style
 * attributes.
 *
 * This does not copy read-only properties
 *
 * @param { HTMLElement } elem DOM element
 * @returns { Record<string, any> } elem
 */
export default function copyAttributes<N extends HTMLElement>(
  elem: N | null | undefined,
) {
  return elem
    ? u.reduce(
        u.entries(elem),
        (acc, [k, v]) => {
          if (k === 'style') u.assign(acc.style, copyStyles(elem))
          else acc[k] = v
          return acc
        },
        {} as Record<keyof N, N[keyof N]>,
      )
    : undefined
}

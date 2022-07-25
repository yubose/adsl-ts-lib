import * as u from '@jsmanifest/utils'

/**
 * Copies the style attributes of a DOM element. This does not copy read-only
 * properties
 * @param { HTMLElement } elem DOM element
 * @returns { CSSStyleDeclaration | undefined } Style object
 */
export default function copyStyles(elem: HTMLElement | null) {
  if (elem?.style) {
    return u.reduce(
      u.entries(elem.style),
      (acc, [k, v]) => {
        if (
          Object.getOwnPropertyDescriptor(elem.style, k)?.writable &&
          v !== '' &&
          k !== 'length' &&
          k !== 'parentRule'
        ) {
          acc[k as string] = v
        }
        return acc
      },
      {} as CSSStyleDeclaration,
    )
  }
}

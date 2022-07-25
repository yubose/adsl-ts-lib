import * as u from '@jsmanifest/utils'

/**
 * Copies the style attributes of a DOM element. This does not copy read-only
 * properties
 * @param { HTMLElement } elem DOM element
 * @param { CSSStyleDeclaration } styles Style object
 * @returns { HTMLElement } elem
 */
export default function applyStyles<N extends HTMLElement>(
  elem: N | null | undefined,
  styles: CSSStyleDeclaration | undefined,
) {
  if (elem?.style && u.isObj(styles)) {
    for (const [k, v] of u.entries(styles)) elem[k] = v
  }
  return elem as N
}

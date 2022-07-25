import type { ReferenceString } from '../ecosTypes'

/**
 * Returns true if the value is prefixed with ~/ (placeholder for base url)
 *
 * true: "~/myBaseUrl"
 *
 * false: "/myBaseUrl"
 *
 * false: "myBaseUrl"
 *
 * false: "~myBaseUrl"
 *
 * @param v Reference string
 * @returns { boolean }
 */

export default function isTildeReference(
  v = '',
): v is ReferenceString<string, '~/'> {
  return v.startsWith('~/')
}

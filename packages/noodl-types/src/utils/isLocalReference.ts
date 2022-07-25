import type { ReferenceString } from '../ecosTypes'

/**
 * true: ".."
 *
 * true: "=.."
 *
 * false: "=."
 */

export default function isLocalReference(
  v = '',
): v is ReferenceString<string, '..'> {
  if (v.startsWith('..')) return true
  if (v.startsWith('=..')) return true
  return false
}

import type { ReferenceString } from '../ecosTypes'

/**
 * true: "."
 *
 * true: "=."
 *
 * false: "=.."
 *
 * false: ".."
 */

export default function isRootReference(
  v = '',
): v is ReferenceString<string, '.'> {
  if (v.startsWith('..')) return false
  if (v.startsWith('=..')) return false
  if (v.startsWith('.') && v[1]?.toUpperCase() === v[1]) return true
  if (v.startsWith('=.') && v[2]?.toUpperCase() === v[2]) return true
  return false
}

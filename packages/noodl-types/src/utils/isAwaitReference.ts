import type { ReferenceString } from '../ecosTypes'

/**
 * true: ".Global.currentUser.vertex.name.firstName@"
 *
 * true: "..message.doc.1.name@"
 *
 * false: "..message.doc.1.name"
 */

export default function isAwaitReference(
  v = '',
): v is ReferenceString<string, '@'> {
  if (v.endsWith('@')) return true
  return false
}

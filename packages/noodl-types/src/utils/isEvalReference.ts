import type { ReferenceString } from '../ecosTypes'

/**
 * True if the value starts with an equal sign "="
 *
 * true: "=.builtIn.string.concat"
 *
 * false: ".builtIn.string.concat"
 *
 * false: "builtIn.string.concat"
 */

export default function isEvalReference(
  v = '',
): v is ReferenceString<string, '='> {
  if (v.startsWith('=')) return true
  return false
}

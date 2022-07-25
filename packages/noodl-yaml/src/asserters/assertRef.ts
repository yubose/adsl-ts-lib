import y from 'yaml'
import type { ReferenceString } from 'noodl-types'
import { consts, is as coreIs, getRefProps } from 'noodl-core'
import createNode from '../utils/createNode'
import deref from '../utils/deref'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import type DocRoot from '../DocRoot'
import { createAssert } from '../assert'

export default createAssert({
  cond: {
    scalar: is.reference,
  },
  fn({ add, node, markers, page, root }) {
    const ref = unwrap(node) as ReferenceString
    if (ref.startsWith('=.builtIn.')) return
    const refProps = getRefProps(ref)

    if (coreIs.tildeReference(ref)) {
      const value = markers.baseUrl + ref.slice(2)
      if (is.scalarNode(node)) node.value = value
      else node = createNode(value)
      return node
    }

    const derefed = deref({
      node: node as y.Scalar<ReferenceString>,
      root: root as DocRoot,
      rootKey: page,
    })

    if (!refProps.isLocalRef) {
      const nextWord = refProps.paths[1]
      if (coreIs.str(nextWord)) {
        const char = nextWord.charAt(0)
        if (char.toUpperCase() === char) {
          add(
            'warn',
            consts.DiagnosticCode.ROOT_REFERENCE_SECOND_LEVEL_KEY_UPPERCASE,
            { ref: refProps.ref, key: nextWord },
          )
        }
      }
    }

    if (coreIs.und(derefed.value)) {
      const isLocal = coreIs.localReference(derefed.reference)
      const locLabel = isLocal ? 'Local' : 'Root'
      const using = isLocal ? ` using root key '${page}'` : ''

      add(
        (diagnostic) => {
          diagnostic.set('type', 'error')
          diagnostic.set(
            'message',
            `${locLabel} reference '${derefed.reference}' was not resolvable${using}`,
          )
          diagnostic.set('results', derefed.results)
        },
        page,
        node,
      )

      return y.visit.SKIP
    } else {
      if (is.scalarNode(node)) {
        node.value = unwrap(derefed.value)
      } else {
        return createNode(derefed.value)
      }
    }
  },
})

import { consts } from 'noodl-core'
import partialR from 'lodash/partialRight'
import has from '../utils/has'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import { createAssert } from '../assert'

export default createAssert({
  cond: [is.mapNode, partialR(has, 'viewTag')],
  fn({ add, isValidViewTag, node, page, root }, { hasBinding }) {
    let viewTag = unwrap(node.get('viewTag')) as string
    const isAction = node.has('goto') || !has('type', node)
    const isComponent = !isAction || has(node, ['children', 'style'])

    if (!isValidViewTag(viewTag)) {
      return add('error', consts.DiagnosticCode.VIEW_TAG_INVALID, { viewTag })
    }

    if (isAction) {
      if (!hasBinding('viewTag', node, page as string, root)) {
        add('warn', consts.DiagnosticCode.VIEW_TAG_MISSING_COMPONENT_POINTER, {
          viewTag,
        })
      }
    } else if (isComponent) {
      //
    }
  },
})

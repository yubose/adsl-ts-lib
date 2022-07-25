import { consts } from 'noodl-core'
import has from '../utils/has'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import { createAssert } from '../assert'

export default createAssert({
  cond: [is.mapNode, has('viewTag')],
  fn({ add, isValidViewTag, node, page, root }, { hasBinding }) {
    let viewTag = unwrap(node.get('viewTag')) as string
    const isAction = has('actionType', 'goto', node) || !has('type', node)
    const isComponent = !isAction || has('children', 'style', node)

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

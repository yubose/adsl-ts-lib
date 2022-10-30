import { consts } from 'noodl-core'
import partialR from 'lodash/partialRight'
import has from '../utils/has'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import { createAssert } from '../assert'

export default createAssert({
  cond: [is.mapNode, partialR(has, 'popUpView')],
  fn({ add, isValidViewTag, node, page, root }, { hasBinding }) {
    let popUpView = unwrap(node.get('popUpView')) as string
    const isAction = has(node, ['actionType', 'goto']) || !has('type', node)
    const isComponent = !isAction || has(node, ['children', 'style'])

    if (!isValidViewTag(popUpView)) {
      return add('error', consts.DiagnosticCode.POPUP_VIEW_INVALID, {
        popUpView,
      })
    }

    if (isAction) {
      if (!hasBinding('popUpView', node, page as string, root)) {
        add(
          'error',
          consts.DiagnosticCode.POPUP_VIEW_MISSING_COMPONENT_POINTER,
          { popUpView },
        )
      }
    } else if (isComponent) {
      //
    }
  },
})

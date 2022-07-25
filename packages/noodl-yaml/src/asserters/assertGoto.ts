import { consts, is as coreIs } from 'noodl-core'
import { Parser } from 'noodl-utils'
import type { DiagnosticObjectMessage } from 'noodl-core'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import { createAssert } from '../assert'
import * as t from '../types'

export default createAssert({
  cond: [is.mapNode, is.goto as any],
  fn(
    { add, isValidPageValue, isValidViewTag, node, markers, page, root },
    { hasPageInAppConfig, refResolvesToAnyValue },
  ) {
    const gotoNode = node as t.Goto
    const destinationNode = gotoNode.get('goto', true)
    const destination = unwrap(destinationNode)

    if (!destination) return add('error', consts.DiagnosticCode.GOTO_PAGE_EMPTY)

    if (coreIs.str(destination)) {
      if (coreIs.pageComponentUrl(destination)) {
        const parsed = new Parser().destination(destination)
        const messages = [] as DiagnosticObjectMessage[]

        add((diagnostic) => {
          for (const [value, type] of [
            [parsed.currentPage, 'currentPage'],
            [parsed.targetPage, 'targetPage'],
            [parsed.viewTag, 'viewTag'],
          ] as const) {
            if (type === 'viewTag') {
              if (!isValidViewTag(value)) {
                diagnostic.error(consts.DiagnosticCode.VIEW_TAG_INVALID, {
                  viewTag: value,
                })
              }
            }

            if (!isValidPageValue(value)) {
              const label =
                type === 'currentPage'
                  ? 'CURRENT_PAGE'
                  : type === 'targetPage'
                  ? 'TARGET_PAGE'
                  : 'VIEW_TAG'
              const code =
                consts.DiagnosticCode[
                  `GOTO_PAGE_COMPONENT_URL_${label}_INVALID`
                ]
              if (code) diagnostic.error(code, { destination, page })
            } else {
              if (!root.has(value)) {
                diagnostic.error(
                  consts.DiagnosticCode.GOTO_PAGE_MISSING_FROM_ROOT,
                  { page: value },
                )
              }
              if (!markers.pages.includes(value)) {
                diagnostic.error(
                  consts.DiagnosticCode.GOTO_PAGE_MISSING_FROM_APP_CONFIG,
                  { destination: value },
                )
              }
            }
          }

          if (messages.length) {
            add((diagnostic) => diagnostic.messages.push(...messages))
          }
        })
      } else {
        if (coreIs.reference(destination)) {
          if (!refResolvesToAnyValue(destinationNode, root, page)) {
            add('error', consts.DiagnosticCode.REFERENCE_UNRESOLVABLE)
          }
        } else {
          if (!hasPageInAppConfig(destination, markers)) {
            add(
              'error',
              consts.DiagnosticCode.GOTO_PAGE_MISSING_FROM_APP_CONFIG,
              { destination },
            )
          }
        }
      }
    } else if (is.mapNode(destinationNode)) {
      if (destinationNode.has('destination')) {
        //
      } else {
        // add({
        //   node: gotoValue,
        //   messages: [],
        //   page,
        // })
      }
    }
  },
})

import { consts, is as coreIs, fp, BuiltIns } from 'noodl-core'
import { visit } from 'yaml'
import type { BuiltInFn, DiagnosticObjectMessage } from 'noodl-core'
import deref from '../utils/deref'
import is from '../utils/is'
import unwrap from '../utils/unwrap'
import { createAssert } from '../assert'
import * as t from '../types'

export default createAssert({
  cond: is.builtInFn,
  fn({ add, data, builtIn, node, page = '', root }, { getJsType, set }) {
    if (is.builtInFn(node)) {
      const builtInKey = unwrap(node.items[0].key)
      const builtInObject = node.get(builtInKey)
      const builtInPath = builtInKey.replace('=.builtIn.', '')

      if (is.mapNode(builtInObject)) {
        const dataIn = builtInObject.get('dataIn', false)
        const dataOut = builtInObject.get('dataOut', false)
        const builtInFn = fp.get(builtIn, builtInPath)
        const messages = [] as DiagnosticObjectMessage[]

        add((diagnostic) => {
          if (!fp.has(builtIn, builtInPath)) {
            messages.push({ type: 'error' })
            diagnostic.error(consts.DiagnosticCode.BUILTIN_FUNCTION_MISSING, {
              key: builtInKey,
            })
          }

          if (coreIs.fnc(builtInFn)) {
            const fnArgs: Parameters<BuiltInFn>[1] = {
              builtIns: builtIn as BuiltIns,
              builtInKey,
              builtInObject,
              builtInPath,
              data,
              dataOut,
              node,
              page,
              root,
            }
            let builtInResult = builtInFn(
              coreIs.fnc(builtIn?.normalize)
                ? builtIn?.normalize(dataIn, fnArgs)
                : dataIn,
              fnArgs,
            )
            if (coreIs.str(builtInResult) && coreIs.reference(builtInResult)) {
              builtInResult = deref({
                node: builtInResult,
                root,
                rootKey: page,
              }).value
            }

            if (coreIs.str(dataOut)) {
              set(dataOut, builtInResult, root, page)
            }
          } else {
            diagnostic.error(
              consts.DiagnosticCode.BUILTIN_FUNCTION_NOT_A_FUNCTION,
              { key: builtInKey, type: getJsType(builtInFn) },
            )
          }
        })
      }
    }
  },
})

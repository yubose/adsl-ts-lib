import { Identify } from 'noodl-types'
import type { NUIActionObjectInput, NUIActionType } from '../types'
import log from '../utils/log'

function getActionType(obj: NUIActionObjectInput): NUIActionType {
  if (obj !== null && typeof obj === 'object') {
    if ('actionType' in obj) return obj.actionType
    if (Identify.folds.emit(obj)) return 'emit'
    if (Identify.goto(obj) || Identify.folds.goto(obj)) return 'goto'
  }
  // log.error(
  //   `%cUnknown actionType "${obj['actionType']}"`,
  //   `color:#ec0000;`,
  //   obj,
  // )
  return 'anonymous'
}

export default getActionType

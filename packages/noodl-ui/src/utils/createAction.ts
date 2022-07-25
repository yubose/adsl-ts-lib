import * as u from '@jsmanifest/utils'
import type { EmitObjectFold } from 'noodl-types'
import { Identify } from 'noodl-types'
import { Action, createAction as __createAction } from 'noodl-action-chain'
import getActionType from './getActionType'
import getActionObjectErrors from './getActionObjectErrors'
import type {
  NUIAction,
  NUIActionObject,
  NUIActionObjectInput,
  NUITrigger,
} from '../types'
import log from '../utils/log'
import { isUnitTestEnv } from './common'
import EmitAction from '../actions/EmitAction'

type EmitLikeObject = Extract<NUIActionObjectInput, EmitObjectFold>
type NonEmitLikeObject = Exclude<NUIActionObjectInput, EmitObjectFold>

function createAction(args: {
  action: NonEmitLikeObject
  trigger: NUITrigger | ''
}): Action
function createAction(args: {
  action: EmitLikeObject
  trigger: NUITrigger | ''
}): EmitAction
function createAction(trigger: NUITrigger | '', obj: NonEmitLikeObject): Action
function createAction(trigger: NUITrigger | '', obj: EmitLikeObject): EmitAction
function createAction(
  args:
    | NUITrigger
    | ''
    | { action: NUIActionObjectInput; trigger: NUITrigger | '' },
  args2?: NUIActionObjectInput | string,
) {
  let action: NUIAction | undefined

  if (u.isStr(args)) {
    if (Identify.folds.emit(args2)) {
      action = new EmitAction(args, args2)
    } else if (args2) {
      if (u.isStr(args2)) {
        action = __createAction(args, { actionType: 'goto', goto: args2 })
      } else if (u.isObj(args2)) {
        if (!('actionType' in args2)) args2['actionType'] = getActionType(args2)
        action = __createAction(args, args2 as NUIActionObject)
      }
    }
  } else if ('action' in args) {
    if (Identify.folds.emit(args.action)) {
      action = new EmitAction(args.trigger, args.action)
    } else {
      if (!('actionType' in (args.action || {}))) {
        args.action = { ...args.action, actionType: getActionType(args.action) }
      }
      action = __createAction(args.trigger, args.action as NUIActionObject)
    }
  }

  if (action?.original && !isUnitTestEnv()) {
    getActionObjectErrors(action.original).forEach((errMsg) => {
      log.error(`%c${errMsg}`, `color:#ec0000;`, action?.original)
    })
  }

  return action
}

export default createAction

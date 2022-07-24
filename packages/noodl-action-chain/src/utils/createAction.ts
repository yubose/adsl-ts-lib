import type { ActionObject } from 'noodl-types'
import { isString, isPlainObject } from '../utils/common'
import Action from '../Action'

function createAction<AType extends string, T extends string>(
  args: {
    action: ActionObject<AType>
    trigger: T
  },
  _?: never,
): Action<AType, T>

function createAction<AType extends string, T extends string>(
  action: ActionObject<AType>,
): Action<AType, T>

function createAction<AType extends string, T extends string>(
  trigger: T,
  action: ActionObject<AType>,
): Action<AType, T>

function createAction<AType extends string, T extends string>(
  args: T | ActionObject<AType> | { action: ActionObject<AType>; trigger: T },
  args2?: ActionObject<AType> | T,
) {
  let trigger: T | undefined
  let object: ActionObject<AType> | undefined

  if (isString(args) && !isString(args2) && isPlainObject(args2)) {
    trigger = args
    object = args2
  } else if (isPlainObject(args)) {
    if (!isString(args) && !('actionType' in args) && 'action' in args) {
      trigger = args.trigger
      object = args.action
    } else if (!isString(args) && 'actionType' in args) {
      trigger = args.trigger
      object = args
    }
  }

  return new Action(trigger || '', object as ActionObject<AType>)
}

export default createAction

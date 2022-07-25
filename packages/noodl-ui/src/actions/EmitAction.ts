import type { EmitObjectFold } from 'noodl-types'
import type { IAction } from 'noodl-action-chain'
import { Action } from 'noodl-action-chain'
import type { EmitActionObject, NUITrigger } from '../types'

class EmitAction
  extends Action<'emit', NUITrigger | ''>
  implements IAction<'emit', NUITrigger | ''>
{
  actions: any[]
  dataKey: string | Record<string, any> | undefined
  #executor: Action['executor'] | undefined

  constructor(
    trigger: NUITrigger | '',
    obj: EmitObjectFold | EmitActionObject,
  ) {
    obj = { ...obj, actionType: 'emit' }
    super(trigger, obj as EmitActionObject)
    this.actions = obj?.emit?.actions || obj?.actions || []
    this.dataKey = obj?.emit?.dataKey || obj?.dataKey
  }

  get executor() {
    return this.#executor as EmitAction['executor']
  }

  set executor(executor: Action['executor']) {
    this.#executor = executor
  }

  snapshot() {
    return {
      ...super.snapshot(),
      dataKey: this.dataKey,
      actions: this.actions,
    }
  }
}

export default EmitAction

import type { ActionObject } from 'noodl-types'
import type AbortExecuteError from './AbortExecuteError'
import type Action from './Action'
import type ActionChain from './ActionChain'
import * as c from './constants'

export interface IAction<
  AType extends string = string,
  T extends string = string,
> {
  actionType: AType
  abort(reason?: Error | string | string[]): void
  aborted: boolean
  execute(...args: any[]): Promise<any>
  executor(...args: any[]): Promise<any>
  executed: boolean
  original: ActionObject<AType>
  result: any
  trigger: T
}

export type ActionStatus =
  | typeof c.ABORTED
  | typeof c.ERROR
  | typeof c.PENDING
  | typeof c.RESOLVED
  | typeof c.TIMED_OUT

export type ActionChainStatus =
  | typeof c.IDLE
  | typeof c.IN_PROGRESS
  | typeof c.ABORTED
  | typeof c.ERROR

export type ActionChainIteratorResult<
  A extends ActionObject = ActionObject,
  T extends string = string,
> = {
  action: Action<A['actionType'], T>
  result: any
}

export interface ActionChainInstancesLoader<
  RT = Action<ActionObject['actionType']>,
> {
  (actions: ActionObject[]): RT[]
}

export interface ActionChainObserver<A extends ActionObject = ActionObject> {
  onAbortStart?: (reason: string | string[] | undefined) => void
  onAbortEnd?: (args: { aborted: Action[]; error: Action[] }) => void
  onAbortError?(args: { action: Action<A['actionType']>; error: Error }): void
  onBeforeAbortAction?(args: {
    action: Action<A['actionType']>
    queue: Action[]
  }): void
  onAfterAbortAction?(args: {
    action: Action<A['actionType']>
    queue: Action[]
  }): void
  /**
   * Invoked prior to looping the ActionChain's queue
   * @param opts Options
   */
  onExecuteStart?(opts: {
    args: any
    actions: ActionObject[]
    data: ActionChain['data']
    queue: Action[]
    trigger: ActionChain['trigger']
    timeout: number
  }): void
  onExecuteError?(args: {
    actions: ActionObject[]
    current: Action
    error: Error | AbortExecuteError
    data: ActionChain['data']
    trigger: ActionChain['trigger']
  }): void
  /**
   * Invoked after looping the ActionChain's queue
   */
  onExecuteEnd?(args: {
    actions: ActionObject[]
    data: ActionChain['data']
    trigger: ActionChain['trigger']
  }): void
  onExecuteResult?(result?: any): void
  onBeforeActionExecute?<A = any>(args: {
    actions: ActionObject[]
    action: Action
    args?: A
    data: ActionChain['data']
    trigger: ActionChain['trigger']
  }): void
  onRefresh?(): void
  onBeforeInject?: (args: {
    action: A | ActionObject
    actions: ActionObject[]
    current: Action
    data: ActionChain['data']
    trigger: ActionChain['trigger']
  }) => void
  onAfterInject?: (
    action: A | ActionObject,
    instance: Action<ActionObject['actionType']>,
  ) => void
}

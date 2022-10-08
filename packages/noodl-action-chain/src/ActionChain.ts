import type { ActionObject } from 'noodl-types'
import type Action from './Action'
import AbortExecuteError from './AbortExecuteError'
import createAction from './utils/createAction'
import isAction from './utils/isAction'
import { createId, isArray, isPlainObject, isString } from './utils/common'
import type {
  ActionChainInstancesLoader,
  ActionChainIteratorResult,
  ActionChainStatus,
  ActionChainObserver,
} from './types'
import * as c from './constants'

class ActionChain<
  A extends ActionObject = ActionObject,
  T extends string = string,
> {
  #abortReason: string | string[] | undefined
  #actions: A[] = []
  #current: Action<A['actionType'], T> | null = null
  #error: null | Error | AbortExecuteError = null
  #gen = {} as AsyncGenerator<
    Action<A['actionType'], T>,
    ActionChainIteratorResult<A, T>[],
    any
  >
  #id: string
  #injected: Action<A['actionType'], T>[] = []
  #loader: ActionChainInstancesLoader | undefined
  #obs = {} as Partial<
    Record<
      keyof ActionChainObserver<A>,
      ActionChainObserver<A>[keyof ActionChainObserver<A>][]
    >
  >
  #queue: Action<A['actionType'], T>[] = []
  #results = [] as ActionChainIteratorResult<A, T>[]
  #status: ActionChainStatus = c.IDLE
  #timeout: NodeJS.Timeout | null = null
  data = new Map()
  trigger: T

  /**
   * Creates an asynchronous generator that generates the next immediate action
   * when the previous has ended
   */
  static async *createGenerator<A extends ActionObject, T extends string>(
    inst: ActionChain,
  ) {
    let action: Action<A['actionType'], T> | undefined
    let results: ActionChainIteratorResult<A, T>[] = []
    let result: any

    while (inst.queue.length) {
      action = inst.queue.shift() as Action<A['actionType'], T>
			// @ts-expect-error
      result = inst.isAborted() ? undefined : await (yield action)
      results.push({ action, result })
    }

    return results
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.snapshot()
  }

  constructor(
    trigger: T,
    actions: A[],
    loader?: ActionChainInstancesLoader,
    id = createId(),
  ) {
    this.#id = id
    this.trigger = trigger
    this.#actions = actions
    this.#loader = loader
  }

  get actions() {
    return this.#actions
  }

  get current() {
    return this.#current
  }

  get id() {
    return this.#id || ''
  }

  get injected() {
    return this.#injected
  }

  get queue() {
    return this.#queue
  }

  set loader(loader: ActionChainInstancesLoader | undefined) {
    this.#loader = loader
  }

  /**
   * Aborts the action chain from executing further
   * @param { string | string[] | undefined } reason
   */
  async abort(_reason?: Error | string | string[]) {
    let reason: string | string[] | undefined

    if (_reason) {
      if (isArray(_reason) && _reason.length > 1) _reason.push(..._reason)
      else if (isArray(_reason)) reason = _reason[0]
      else if (_reason instanceof Error) {
        reason = _reason.message
        this.#error = _reason
      } else if (_reason) reason = _reason
    }

    this.#emit('onAbortStart', reason)
    this.#setStatus(c.ABORTED, reason)

    // The loop below should handle the current pending action.
    // Since this.current is never in the queue, we have to insert it back to the list for the while loop to pick it up
    if (this.current && !this.current.executed) {
      this.#queue.unshift(this.current)
    }

    let aborted = [] as Action[]
    let error = [] as Action[]

    // Exhaust the remaining actions in the queue and abort them
    while (this.#queue.length) {
      const action = this.#queue.shift() as Action<A['actionType'], T>
      if (action && action.status !== 'aborted') {
        try {
          this.#emit('onBeforeAbortAction', { action, queue: this.#queue })
          action?.abort(reason || '')
          this.#emit('onAfterAbortAction', { action, queue: this.#queue })
        } catch (error) {
          this.#error = error as Error
          this.#emit('onAbortError', { action, error: error as Error })
        } finally {
          this.#results.push({
            action,
            result: new AbortExecuteError(
              'Aborted from calling the abort method',
            ),
          })
        }
      }
    }

    this.#current = null
    this.#emit('onAbortEnd', { aborted, error })
    return this.#results
  }

  #getDefaultCallbackArgs = () => ({
    actions: this.actions,
    data: this.data,
    trigger: this.trigger,
  })

  clear(
    key?:
      | 'actions'
      | 'data'
      | 'error'
      | 'hooks'
      | 'queue'
      | 'results'
      | 'timeout',
  ) {
    if (arguments.length) {
      key === 'data'
        ? this.data.clear()
        : key === 'actions'
        ? (this.#actions.length = 0)
        : key === 'queue'
        ? (this.#queue.length = 0)
        : key === 'results'
        ? (this.#results.length = 0)
        : key === 'timeout'
        ? this.#timeout && (clearTimeout(this.#timeout), (this.#timeout = null))
        : key === 'error'
        ? this.#error && (this.#error = null)
        : key === 'hooks'
        ? Object.keys(this.#obs).forEach((key) => delete this.#obs[key])
        : undefined
    } else {
      this.data.clear()
      this.#current = null
      this.#actions.length = 0
      this.#queue.length = 0
      this.#results.length = 0
      this.#timeout && clearTimeout(this.#timeout)
      this.#error && (this.#error = null)
      Object.keys(this.#obs).forEach((key) => delete this.#obs[key])
    }
  }

  async execute(args?: any, { timeout = 10000 }: { timeout?: number } = {}) {
    try {
      this.#results = []
      this.#setStatus(c.IN_PROGRESS)
      this.#emit('onExecuteStart', {
        ...this.#getDefaultCallbackArgs(),
        args,
        queue: this.queue,
        timeout,
      })

      let action: Action<A['actionType'], T> | undefined
      let iterator: IteratorResult<Action, ActionChainIteratorResult<A, T>[]>
      let result: any

      // Initiates the generator (note: this first invocation does not execute
      // any actions, it steps into it so the actual execution of actions
      // begins at the second call to this.next)
      iterator = await this.next?.()

      if (iterator) {
        while (!iterator?.done) {
          try {
            if (this.#timeout) clearTimeout(this.#timeout)
            // Cache the reference since it could be changed when setTimeout fires
            let cachedAction = action
            this.#timeout = setTimeout(() => {
              const msg = `Action of type "${cachedAction?.actionType}" timed out`
              cachedAction?.abort?.(msg)
              cachedAction = null as any
              try {
                this.abort(msg)
              } catch (error) {
                throw new AbortExecuteError((error as Error).message)
              }
            }, timeout)

            if (iterator) {
              if (!iterator.done) {
                action = iterator?.value as Action<A['actionType'], T>

                if (action?.status !== 'aborted') {
                  this.#emit('onBeforeActionExecute', {
                    ...this.#getDefaultCallbackArgs(),
                    action,
                    args,
                  })
                  result = await action?.execute?.(args)
                  this.#emit('onExecuteResult', result)
                  this.#results.push({
                    action: action as Action<A['actionType'], T>,
                    result: action?.result,
                  })
                  iterator = await this.next?.(result)
                }
              }
            } else {
              await this.abort(
                `Expected an iterator to be returned but received ${typeof iterator} instead`,
              )
            }

            if (isPlainObject(result) && 'wait' in result) {
              // This block is mostly intended for popUps to "wait" for a user interaction
              await this?.abort?.(
                `An action returned from a "${action?.actionType}" type requested to wait`,
              )
            }
          } catch (error) {
            // TODO - replace throw with appending the error to the result item instead
            throw error
          } finally {
            this.#timeout && clearTimeout(this.#timeout)
          }
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.#emit('onExecuteError', {
        ...this.#getDefaultCallbackArgs(),
        current: this.current as Action,
        error: err,
      })
      await this.abort?.(err.message)
      // throw new AbortExecuteError(error.message)
    } finally {
			this.#emit('onExecuteEnd', this.#getDefaultCallbackArgs())
      this.#refresh?.()
    }
    return this.#results
  }

  inject(action: A | ActionObject) {
    this.#emit('onBeforeInject', {
      ...this.#getDefaultCallbackArgs(),
      action,
      current: this.current as Action,
    })
    const inst = this.load(action)
    this.#queue.unshift(inst)
    this.#injected.push(inst)
    this.#emit('onAfterInject', action, inst)
    return inst
  }

  isAborted() {
    if (this.#status === c.ABORTED) return true
    return false
  }

  /**
   * Converts one or more raw action objects to their instances and returns them.
   * If a loader was provided in the constructor, it will delegate to that function
   * to provide the instances
   */
  load(action: A | ActionObject): Action<A['actionType'], T>
  load(actions: (A | ActionObject)[]): Action<A['actionType'], T>[]
  load(arg: A | ActionObject | (A | ActionObject)[]) {
    if (isArray(arg)) {
      return (
        this.#loader?.(arg as A[]) ||
        arg.map((o) => createAction(this.trigger, o))
      )
    } else if (this.#loader) {
      return this.#loader([arg as A])[0]
    }
    return createAction(this.trigger, arg)
  }

  /**
   * Loads the queue by converting actions into their instances. If a loader
   * was provided in the constructor, it will use that function to load the queue
   */
  loadQueue() {
    let actions =
      this.#loader?.(this.actions) || ([] as Action<A['actionType'], T>[])

    if (!Array.isArray(actions)) actions = [actions]

    actions.forEach(
      (action: any, index: number) => (this.#queue[index] = action),
    )

    if (this.#queue.length > actions.length) {
      while (this.#queue.length > actions.length) this.#queue.pop()
    }
    // @ts-expect-error
    this.#gen = ActionChain.createGenerator<A, T>(this)
    return this.#queue
  }

  /**
   * Runs the next async iterator result as { done, value }
   * @param { any } callerResult - Result of previous call passes as arguments to the generator yielder
   */
  async next(callerResult?: any) {
    const result = await this.#gen?.next?.(callerResult)
    if (result) {
      if (!result.done && isAction(result.value)) {
        this.#current = result.value
      }
      if (result.done) {
        this.#current = null
      }
    }
    return result
  }

  #refresh = () => {
    this.#timeout && clearTimeout(this.#timeout)
    this.loadQueue()
    this.#setStatus(c.IDLE)
    this.#emit('onRefresh')
  }

  #setStatus = (
    status: typeof c.IDLE | typeof c.IN_PROGRESS | typeof c.ABORTED,
    arg?: Error | AbortExecuteError | string | string[],
  ) => {
    if (status === c.IDLE) {
      this.#status = c.IDLE
    } else if (status === c.IN_PROGRESS) {
      this.#status = c.IN_PROGRESS
    } else if (status === c.ABORTED) {
      this.#status = c.ABORTED
      if (isArray(arg) && arg.length > 1) {
        this.#abortReason = arg
      } else if (isArray(arg)) {
        this.#abortReason = arg[0]
      } else if (isString(arg)) {
        this.#abortReason = arg
      }
    } else if (status === c.ERROR) {
      this.#status = c.ERROR
      this.#error = arg as Error | AbortExecuteError
    }
    return this
  }

  /** Returns a snapshot of the overall state */
  snapshot<SnapshotResult extends Record<string, any>>(opts?: SnapshotResult) {
    const snapshot = {
      abortReason: this.#abortReason,
      actions: this.actions,
      data: Array.from(this.data.values()),
      error: this.#error,
      current: this.current,
      injected: this.#injected,
      queue: this.queue.map((o) => o?.snapshot()),
      results: this.#results,
      status: this.#status,
      trigger: this.trigger,
      ...opts,
    }
    return snapshot as typeof snapshot & SnapshotResult
  }

  #emit = <Evt extends keyof ActionChainObserver<A>>(
    evt: Evt,
    ...args: Parameters<NonNullable<ActionChainObserver<A>[Evt]>>
  ) => {
    this.#obs?.[evt]?.forEach?.((fn) => (fn as any)?.call?.(this, ...args))
  }

  use(obj?: Partial<ActionChainObserver>) {
    if (isPlainObject(obj)) {
      Object.entries(obj).forEach(([evt, fn]) => {
        if (!this.#obs[evt]) this.#obs[evt] = []
        this.#obs[evt]?.push(fn)
      })
    }
    return this
  }

  toJSON() {
    return {
      actions: this.actions,
      trigger: this.trigger,
      // injected: this.injected,
      // queue: this.queue,
      // results: this.#results,
      // status: this.#status,
    }
  }
}

export default ActionChain

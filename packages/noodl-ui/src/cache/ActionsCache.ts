import * as u from '@jsmanifest/utils'
import type { LiteralUnion } from 'type-fest'
import type { ICache, NUIActionType, NUITrigger, Store } from '../types'
import {
  actionTypes as allActionTypes,
  groupedActionTypes,
  triggers,
} from '../constants'

type OtherActionTypes = Exclude<
  LiteralUnion<NUIActionType, string>,
  'builtIn' | 'emit' | 'register'
>

const getInitialActionsState = <AType extends string, StoreObj = any>(
  actionTypes: AType[],
) => {
  const actions = new Map<LiteralUnion<AType, string>, StoreObj[]>()
  actionTypes.forEach((t) => actions.set(t, []))
  return actions
}

type ActionsStore<AType extends string, StoreObj = any> = Map<
  LiteralUnion<AType, string>,
  StoreObj[]
>

const getDefaultState = () =>
  allActionTypes.reduce(
    (acc, type) => {
      acc[type] = {
        executor: {
          calls: { count: 0, timestamps: [] },
        },
      }
      return acc
    },
    {} as Record<
      NUIActionType,
      {
        executor: {
          calls: {
            count: number
            timestamps: { id: number; timestamp: string }[]
          }
        }
      }
    >,
  )

class ActionsCache<ETrigger extends string = string> implements ICache {
  #actions: ActionsStore<OtherActionTypes, Store.ActionObject>
  #builtIns: ActionsStore<'builtIn', Store.BuiltInObject>
  #emits: ActionsStore<
    LiteralUnion<NUITrigger | ETrigger, string>,
    Store.ActionObject[]
  >
  state = getDefaultState();

  [Symbol.iterator]() {
    const items = [
      ...this.#actions.values(),
      ...this.#builtIns.values(),
      ...this.#emits.values(),
    ].reverse()
    return {
      next: () => ({ value: items.pop(), done: !items.length }),
    }
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      ...this,
      length: this.length,
    }
  }

  constructor() {
    this.#actions = getInitialActionsState([...groupedActionTypes])
    this.#builtIns = getInitialActionsState([])
    this.#emits = getInitialActionsState([...triggers])

    for (const actionType of this.#actions.keys()) {
      Object.defineProperty(this, actionType, {
        configurable: true,
        enumerable: true,
        get: () => this.#actions.get(actionType),
      })
    }
    Object.defineProperty(this, 'builtIn', {
      configurable: true,
      enumerable: true,
      get: () => this.#builtIns,
    })
    Object.defineProperty(this, 'emit', {
      configurable: true,
      enumerable: true,
      get: () => this.#emits,
    })
  }

  get length() {
    return this.#actions.size + this.#builtIns.size + this.#emits.size
  }

  clear() {
    this.#actions.clear()
    this.#builtIns.clear()
    this.#emits.clear()
    this.state = getDefaultState()
  }

  exists(fn: Store.ActionObject['fn'] | Store.BuiltInObject['fn']) {
    if (u.isFnc(fn)) {
      for (const objs of this) {
        if (objs) {
          for (const obj of objs) {
            if ('actionType' in obj) {
              if (obj.fn === fn) return true
            } else {
              if (obj.some((o) => o.fn === fn)) return true
            }
          }
        }
      }
    }
    return false
  }

  reset() {
    this.#actions = getInitialActionsState([...groupedActionTypes])
    this.#builtIns = getInitialActionsState([])
    this.#emits = getInitialActionsState([...triggers])
  }
}

export default ActionsCache

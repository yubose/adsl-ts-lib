import {
  ActionChain,
  ActionChainInstancesLoader,
  createActionChain as __createActionChain,
} from 'noodl-action-chain'
import type { NUIActionChain, NUIActionObject, NUITrigger } from '../types'

function createActionChain(args: {
  actions: NUIActionObject[]
  trigger: NUITrigger
  loader?: ActionChainInstancesLoader
  id?: string
}): NUIActionChain

function createActionChain(
  trigger: NUITrigger,
  actions: NUIActionObject[],
  loader?: ActionChainInstancesLoader,
  id?: string,
): NUIActionChain

function createActionChain(
  args:
    | NUITrigger
    | {
        actions: NUIActionObject[]
        trigger: NUITrigger
        loader?: ActionChainInstancesLoader
        id?: string
      },
  actions?: NUIActionObject[] | ActionChainInstancesLoader,
  loader?: ActionChainInstancesLoader,
  id?: string,
) {
  let ac: ActionChain

  if (typeof args === 'string') {
    ac = __createActionChain(args, actions as NUIActionObject[], loader, id)
  } else {
    ac = __createActionChain(args)
  }

  return ac as NUIActionChain
}

export default createActionChain

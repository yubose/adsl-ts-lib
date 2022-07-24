import type Action from '../Action'

function isAction(obj: unknown): obj is Action {
  return !!(
    obj &&
    !Array.isArray(obj) &&
    typeof obj === 'object' &&
    !('queue' in obj) &&
    ('hasExecutor' in obj || 'executor' in obj)
  )
}

export default isAction

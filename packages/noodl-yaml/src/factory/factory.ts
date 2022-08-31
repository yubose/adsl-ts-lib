import { fp, is as coreIs } from 'noodl-core'
import createEmit from './emit'
import createIf from './if'
import * as t from '../types'

function factory() {
  return {
    if(...args: Parameters<typeof createIf>) {
      return createIf(...args)
    },
    emit(...args: Parameters<typeof createEmit>) {
      return createEmit(...args)
    },
  }
}

export default factory

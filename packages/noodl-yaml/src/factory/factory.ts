import createEmit from './emit'
import createIf from './if'

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

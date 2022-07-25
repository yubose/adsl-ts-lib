import * as u from '@jsmanifest/utils'
import add from 'date-fns/add'

class Timer {
  #onClear: Timer['onClear']
  #onIncrement: Timer['onIncrement']
  dataKey: string
  isGlobal: boolean | undefined
  pageName: string
  ref: NodeJS.Timeout | undefined
  value: Date | undefined;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      dataKey: this.dataKey,
      hasOnClearCallback: u.isFnc(this.#onClear),
      hasOnIncrementCallback: u.isFnc(this.#onIncrement),
      isGlobal: this.dataKey
        .replace(/(\.|=|-|@|_)/g, '')
        .toLowerCase()
        .startsWith('global'),
      isRunning: !u.isUnd(this.ref),
      pageName: this.pageName,
      ref: this.ref,
      value: this.value,
    }
  }

  constructor({
    dataKey = '',
    initialValue,
    pageName = '',
  }: { dataKey?: string; initialValue?: Date; pageName?: string } = {}) {
    this.dataKey = dataKey
    this.pageName = pageName
    this.value = initialValue
  }

  increment() {
    this.value = add(new Date(this.value as Date), { seconds: 1 })
    this.#onIncrement?.(this.value)
    return this.value
  }

  start() {
    this.ref = setInterval(this.increment.bind(this), 1000)
  }

  clear() {
    clearInterval(this.ref)
    this.ref = undefined
    this.#onClear?.()
  }

  on<Evt extends 'increment'>(evt: Evt, fn: Timer['onIncrement']) {
    if (evt === 'increment') this.onIncrement = fn
    return this
  }

  set onClear(fn: (() => void) | undefined) {
    this.#onClear = fn
  }

  set onIncrement(fn: ((value: Date | undefined) => void) | undefined) {
    this.#onIncrement = fn
  }
}

export default Timer

import * as u from '@jsmanifest/utils'
import Timer from './Timer'

class Timers {
  #timers: Map<string, Timer> = new Map()

  has(dataKey: string) {
    return this.#timers.has(dataKey)
  }

  get(): Map<string, Timer>
  get(dataKey: string): Timer
  get(dataKey?: string) {
    if (!dataKey) return this.#timers
    return this.#timers.get(dataKey)
  }

  set(dataKey: string, args?: ConstructorParameters<typeof Timer>[0]) {
    this.#timers.set(dataKey, new Timer({ dataKey, ...args }))
    return this.#timers.get(dataKey) as Timer
  }

  remove(timer: string | Timer) {
    let inst: Timer | undefined
    if (u.isStr(timer)) {
      this.#timers.has(timer) && (inst = this.#timers.get(timer))
    } else if (this.#timers.has(timer?.dataKey)) {
      this.#timers.delete(timer.dataKey)
    }
    if (inst) {
      console.log(
        `%cRemoving timer using dataKey "${inst.dataKey}"`,
        `color:#95a5a6;`,
      )
      this.#timers.delete(inst.dataKey)
      inst.onClear = undefined
      inst.onIncrement = undefined
      inst = undefined as any
    }
  }
}

export default Timers

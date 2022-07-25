import type { Transaction, TransactionId } from '../types'

class TransactionCache {
  #cache = new Map<TransactionId, Transaction[TransactionId]>()
  #transactions = {
    register: new Map<string, (...args: any[]) => any>(),
  }

  static _inst: TransactionCache

  constructor() {
    if (TransactionCache._inst) return TransactionCache._inst
    TransactionCache._inst = this
  }

  clear() {
    this.#cache.clear()
    return this
  }

  get<K extends TransactionId>(transaction: K): Transaction[K]
  get(): Map<TransactionId, Transaction[TransactionId]>
  get<K extends TransactionId>(transaction?: K) {
    if (!transaction) return this.#cache
    return this.#cache.get(transaction)
  }

  has<K extends TransactionId>(transaction: K) {
    return this.#cache.has(transaction)
  }

  set<K extends TransactionId>(
    transaction: K,
    obj: Transaction[TransactionId],
  ) {
    this.#cache.set(transaction, obj)
    return this
  }

  getHandler<Evt extends string>(type: string, event: Evt) {
    if (type === 'register') return this.#transactions.register.get(event)
  }

  useHandler<Evt extends string>(
    type: string,
    opts: { event: Evt; fn: (...args: any[]) => Promise<any> },
  ) {
    if (type === 'register') {
      this.#transactions.register.set(opts.event, opts.fn)
    }
    return this
  }
}

export default TransactionCache

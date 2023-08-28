interface TimerObject {
  type: 'Interval' | 'Timeout',
  timer: NodeJS.Timer
}

class TimerCache{
    #cache = new Map<string, TimerObject>()
    static _inst: TimerCache

    constructor(){
        if (TimerCache._inst) return TimerCache._inst
        TimerCache._inst = this
    }

    get length() {
        return this.#cache.size
    }
    
    clear() {
      this.#cache.clear()
      return this
    }
    
    has<N extends string = string>(name: N | undefined) {
      if (!name) return false
      return this.#cache.has(name)
    }
  
    get<N extends string = string>(name: N): TimerObject 
    get(): Map<string, TimerObject >
    get<N extends string = string>(name?: N) {
      if (!name) return this.#cache
      return this.#cache.get(name)
    }
  
    set<N extends string = string>(name: N, obj: TimerObject ) {
      this.#cache.set(name, obj as TimerObject )
      return obj as TimerObject 
    }
  
    remove<N extends string = any>(name: N): this {
      const timerObj = this.#cache.get(name)
      if(timerObj?.type === 'Interval'){
        //@ts-expect-error
        clearInterval(timerObj.timer)
      }else if(timerObj?.type === 'Timeout'){
        //@ts-expect-error
        clearTimeout(timerObj.timer)
      }
      this.#cache.delete(name)
      return this
    }
}

export default TimerCache
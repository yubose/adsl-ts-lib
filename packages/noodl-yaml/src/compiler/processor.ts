import { fp, is as coreIs } from 'noodl-core'

export class Processor {
  consumed = [] as any[]
  tokens = [] as any[]
  root = {} as Record<string, any>

  consume() {
    const token = this.consumed.shift()
    this.tokens.push(token)
    return token
  }

  process(value: unknown) {
    if (coreIs.str(value)) {
      if (coreIs.reference(value)) {
        //
      } else {
        //
      }
    }
  }
}

export function decode(value: string) {
  if (coreIs.str(value)) {
    if (coreIs.reference(value)) {
      const obj = { type: 'Reference' } as any

      if (coreIs.evalReference(value)) {
        obj.isLocal = coreIs.evalLocalReference(value)
        // obj.isKey =
      }

      return obj
    } else {
      return { type: 'Value' }
    }
  } else if (coreIs.obj(value)) {
  }
}

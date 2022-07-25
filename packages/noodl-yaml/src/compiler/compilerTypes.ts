import * as c from '../constants'
import type DocRoot from '../DocRoot'
import { Basic, Organic } from './compilerConstants'

export namespace Processor {
  export interface Instruction {
    type: Basic | Organic
    value: any
  }

  export interface Options<N = unknown> {
    instructions: Instruction[]
    node: N
    root: DocRoot
    rootKey?: string
  }
}

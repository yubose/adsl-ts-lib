import type { ReferenceString } from 'noodl-types'
import { consts, fp } from 'noodl-core'
import { isScalar } from '../utils/yaml'
import {
  getScalarType,
  getNodeKind,
  getIfNodeItemKind,
  getProcessWriteType,
} from './utils'
import get from '../utils/get'
import { Basic, Organic } from './compilerConstants'
import type { If, IfNode } from '../types'
import * as t from './compilerTypes'
import * as c from '../constants'

export const symbols = {
  '@': null,
  '.': null,
  '=': null,
  '~': null,
  _: null,
}

export function createBasicOperation(symbol: string, value: any) {
  // Inheritance
  // Extension
  // Override
  // Evaluation
  // If/Else
  // Goto
  const charCode = symbol.charCodeAt(0)
  if (charCode === consts.CharCode.At) {
    //
  } else if (charCode === consts.CharCode.Dot) {
    //
  } else if (charCode === consts.CharCode.Equals) {
    //
  } else if (charCode === consts.CharCode.Tilde) {
    //
  } else if (charCode === consts.CharCode.Underline) {
    //
  }
}

export function createOrganicOperation() {
  // Evolve
  // Elite
  // Convolve
  // Emit
}

export function createProcessor() {
  function read() {
    //
  }

  function write() {
    //
  }

  function next() {
    //
  }

  function getState() {
    //
  }

  return {
    read,
    write,
    next,
    getState,
  }
}

export function createInstructions(value: string) {
  const instructions = [] as t.Processor.Instruction[]
  const len = value.length

  for (let index = 0; index < len; index++) {
    const char = value[index]
    const charCode = char.charCodeAt(0)
    const instruction = { value: char } as t.Processor.Instruction

    if (charCode === consts.CharCode.At) {
      instruction.type = Basic.Override
    } else if (charCode === consts.CharCode.Dot) {
      instruction.type = Basic.Inherit
    } else if (charCode === consts.CharCode.Equals) {
      instruction.type = Basic.Evaluate
    } else if (charCode === consts.CharCode.Tilde) {
      // instruction.type = Basic
    } else if (charCode === consts.CharCode.Underline) {
      instruction.type = Basic.Left
    } else {
      instruction.type = Basic.Right
    }

    instructions.push(instruction)
  }

  return instructions
}

export function createInterpretations(nodes: unknown[] | unknown) {
  return fp.toArr(nodes).map((node) => {
    const kind = getNodeKind(node)

    if (isScalar(node)) {
      switch (getScalarType(node)) {
        case c.ScalarType.String: {
          switch (kind) {
            case c.ScalarKind.Reference: {
              const ref = node.value as ReferenceString
              const tape = createInstructions(ref)
              break
            }
            default:
              break
          }
        }
      }
    }
  })
}

export function createIfInterpreter(node: If) {
  return createInterpretations((node.get('if') as IfNode).items)
}

export function createSomething() {
  const list = [] as any[]
  return list
}

export function process<N = unknown>({
  instructions = [],
  node,
  root,
  rootKey = '',
}: Partial<t.Processor.Options<N>>) {
  instructions = [...instructions].reverse()
  const results = [] as any[]

  let currentValue = ''

  while (instructions.length) {
    const { type, value } = instructions.pop() ?? {}

    if (type === Basic.Left) {
      //
    } else if (type === Basic.Right) {
      results.push(value)
    } else if (type === Basic.If) {
      //
    } else if (type === Basic.Else) {
      //
    } else if (type === Basic.Evaluate) {
      // const writeType = getProcessWriteType(value)
      // if (writeType === c.ProcessWriteType.AtMerge) {
      //   //
      // } else if (writeType === c.ProcessWriteType.LocalMerge) {
      //   //
      // } else if (writeType === c.ProcessWriteType.RootMerge) {
      //   //
      // } else {
      //   //
      // }
    } else if (type === Basic.Extend) {
      //
    } else if (type === Basic.Goto) {
      //
    } else if (type === Basic.Inherit) {
      const something = createSomething()
    } else if (type === Basic.Override) {
      //
    } else if (type === Organic.Convolve) {
      //
    } else if (type === Organic.Elite) {
      //
    } else if (type === Organic.Emit) {
      //
    } else if (type === Organic.Evolve) {
      //
    }
  }

  return results
}

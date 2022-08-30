import { fp, is } from 'noodl-core'
import * as c from '../constants'
import * as mu from './machineTypes'
import * as t from '../types'

export function getRefInstructions(value: string, instructions = [] as any[]) {
  const instruction = { value } as any

	

  if (!is.str(value)) {
    instruction.type = c.ReferenceInstruction.Return
  } else if (value.startsWith('..')) {
    instruction.type = c.ReferenceInstruction.LocalMerge
  } else if (value.startsWith('.')) {
    instruction.type = c.ReferenceInstruction.RootMerge
  } else if (value.startsWith('=')) {
    instruction.type = c.ReferenceInstruction.Evaluate
  } else if (value.endsWith('@')) {
    instruction.type = c.ReferenceInstruction.Await
  } else {
    instruction.type = c.ReferenceInstruction.Return
  }

  return instructions.concat(instruction)
}

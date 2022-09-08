import { Cursor } from './cursor'

export class Block {
  cursor = new Cursor()
  items = [] as any[]
}

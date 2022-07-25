import type { ComponentObject } from './componentTypes'

export interface PageObject {
  components: ComponentObject[]
  final?: string // ex: "..save"
  init?: string[] // ex: ["..formData.edge.get", "..formData.w9.get"]
  check?: string[]
  save?: string[]
  update?: string[]
  module?: string
  pageNumber?: string
  viewport?: any
  lastTop?: number
  [key: string]: any
}

import type { ComponentObject } from './componentTypes'

/**
 * Common properties found on pages.
 * Computed via **TBH**
 */
export interface PageObject {
  apiRequest?: any
  init?: any[] // ex: ["..formData.edge.get", "..formData.w9.get"]
  components: ComponentObject[]
  check?: any[]
  event?: any
  final?: any // ex: "..save"
  formData?: any
  generalInfo?: any
  lastTop?: number
  listData?: any
  module?: string
  pageNumber?: string | number
  save?: any
  title?: string
  viewPort?: any
  update?: string[]
  [key: string]: any
}

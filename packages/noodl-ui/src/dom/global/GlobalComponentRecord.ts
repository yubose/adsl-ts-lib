import GlobalRecord from './GlobalRecord'
import type Page from '../Page'
import { DATA_GLOBALID } from '../../constants'
import type { NuiComponent } from '../../types'

export interface GlobalComponentMapOptions {
  component: NuiComponent.Instance
  id?: string
  node?: HTMLElement | null
  page: Page
}

class GlobalComponentRecord extends GlobalRecord<'component'> {
  #id: string = ''
  componentId: string
  nodeId: string | undefined
  pageId: string
  pageName: string;

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor({ id, component, node, page }: GlobalComponentMapOptions) {
    super()

    if (!id) {
      this.#id = component?.get?.(DATA_GLOBALID)
    } else {
      this.#id = id
    }

    this.componentId = component.id
    this.nodeId = node?.id || component.id || ''
    this.pageId = page.id as string
    this.pageName = page.page || ''
  }

  get globalId() {
    return this.#id
  }

  toJSON() {
    return {
      globalId: this.globalId,
      componentId: this.componentId,
      nodeId: this.nodeId,
      pageId: this.pageId,
    }
  }
}

export default GlobalComponentRecord

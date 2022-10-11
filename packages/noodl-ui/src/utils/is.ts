import * as u from '@jsmanifest/utils'
import type { ComponentObject } from 'noodl-types'
import { Identify } from 'noodl-types'
import type Component from '../Component'
import type Viewport from '../Viewport'
import type Page from '../Page'
import * as c from '../constants'

const is = {
  ...Identify,
  nuiComponent: (v: unknown): v is Component =>
    u.isObj(v) && v[c.NUI_ID] === c.NUI_COMPONENT,
  nuiPage: (v: unknown): v is Page => u.isObj(v) && v[c.NUI_ID] === c.NUI_PAGE,
  nuiViewport: (v: unknown): v is Viewport =>
    u.isObj(v) && v[c.NUI_ID] === c.NUI_VIEWPORT,
  componentReference(value: string | ComponentObject | null) {
    if (u.isStr(value) && Identify.reference(value)) return true
    if (u.isObj(value) && Identify.reference(value.type)) return true
    return false
  },
}

export default is

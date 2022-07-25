import * as u from '@jsmanifest/utils'
import type { ComponentObject } from 'noodl-types'
import { Identify } from 'noodl-types'

const is = {
  ...Identify,
  componentReference(value: string | ComponentObject | null) {
    if (u.isStr(value) && Identify.reference(value)) return true
    if (u.isObj(value) && Identify.reference(value.type)) return true
    return false
  },
}

export default is

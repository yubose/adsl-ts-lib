import * as R from 'ramda'
import * as u from '@jsmanifest/utils'
import * as c from '../constants'
import * as t from '../types'

export const withBaseURL = R.curryN(2, (baseURL: string, value = '') => {
  if (baseURL.endsWith('/') && value.startsWith('/')) {
    value = value.substring(1)
  } else if (!baseURL.endsWith('/') && !value.startsWith('/')) {
    value = `/${value}`
  }
  return `${baseURL}${value}`
})

export function configUri(value = '') {
  return withBaseURL(c.baseRemoteConfigUrl)(
    value.endsWith('.yml') ? value : `${value}.yml`,
  )
}

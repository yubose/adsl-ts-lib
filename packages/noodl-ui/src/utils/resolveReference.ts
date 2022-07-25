import * as u from '@jsmanifest/utils'
import type NuiPage from '../Page'
import is from './is'
import { defaultResolveReference } from './internal'

function resolveReference({
  value,
  page,
  root,
  localKey,
}: {
  value?: string
  root: Record<string, any> | (() => Record<string, any>)
  localKey: string | undefined
  page?: NuiPage
}) {
  const pageName = localKey || page?.page || ''
  value = defaultResolveReference(root, pageName, value as any)
  while (u.isStr(value) && is.reference(value)) {
    value = defaultResolveReference(root, pageName, value)
  }

  return value
}

export default resolveReference

import * as nt from 'noodl-types'
import * as nu from 'noodl-utils'
import resolveReference from './resolveReference'
import type NuiPage from '../Page'
import type { NuiComponent, On } from '../types'

export default function resolvePageComponentUrl({
  root,
  component,
  page,
  localKey = page?.page || '',
  key = '',
  value,
  on,
}: {
  component?: NuiComponent.Instance
  key?: string
  value?: any
  root: Record<string, any> | (() => Record<string, any>)
  localKey: string | undefined
  on?: On | undefined | null
  page?: NuiPage
}): nt.PageComponentUrl {
  let { currentPage, targetPage, viewTag } = new nu.Parser().destination(value)

  if (on?.pageComponentUrl) {
    return on?.pageComponentUrl({
      component,
      page,
      key,
      value,
    }) as nt.PageComponentUrl
  }

  if (nt.Identify.reference(currentPage)) {
    currentPage = resolveReference({
      page,
      value: currentPage,
      localKey,
      root,
    }) as any
  }

  if (nt.Identify.reference(targetPage)) {
    targetPage = resolveReference({
      page,
      value: targetPage,
      localKey,
      root,
    }) as any
  }

  if (nt.Identify.reference(viewTag)) {
    viewTag = resolveReference({
      page,
      value: viewTag,
      localKey,
      root,
    }) as any
  }

  return `${targetPage}@${currentPage}#${viewTag}`
}

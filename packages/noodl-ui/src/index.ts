export { default as Component } from './Component'
export { default as ActionsCache } from './cache/ActionsCache'
export { default as ComponentCache } from './cache/ComponentCache'
export { default as PageCache } from './cache/PageCache'
export { default as PluginCache } from './cache/PluginCache'
export { default as RegisterCache } from './cache/RegisterCache'
export { default as TransactionsCache } from './cache/TransactionsCache'
export { default as EmitAction } from './actions/EmitAction'
export { default as resolveComponents } from './resolvers/resolveComponents'
export { default as resolveDataAttribs } from './resolvers/resolveDataAttribs'
export { default as resolveStyles } from './resolvers/resolveStyles'
export { default as Resolver } from './Resolver'
export { default as createAction } from './utils/createAction'
export { default as createActionChain } from './utils/createActionChain'
export { default as createComponent } from './utils/createComponent'
export { default as deref } from './deref'
export { default as getActionObjectErrors } from './utils/getActionObjectErrors'
export { default as getBaseStyles } from './utils/getBaseStyles'
export { default as getByRef } from './utils/getByRef'
export { default as isComponent } from './utils/isComponent'
export { default as isPage } from './utils/isPage'
export { default as isViewport } from './utils/isViewport'
export { default as normalizeProps, default as parse } from './normalizeProps'
export { default as resolvePageComponentUrl } from './utils/resolvePageComponentUrl'
export { default as resolveReference } from './utils/resolveReference'
export { default as Transformer } from './Transformer'
export { default as NUI } from './noodl-ui'
export { default as Page } from './Page'
export { default as Viewport } from './Viewport'
export {
  nuiEvent as event,
  groupedActionTypes as nuiGroupedActionTypes,
  nuiEmitType,
  nuiEmitTransaction,
} from './constants'
export {
  evalIf,
  findListDataObject,
  findIteratorVar,
  findParent,
  flatten,
  getDataValues,
  isListConsumer,
  parseReference,
  publish,
  pullFromComponent,
  resolveAssetUrl,
} from './utils/noodl'
export { formatColor } from './utils/common'
export {
  getPositionProps,
  getSize,
  getViewportRatio,
  isNoodlUnit,
  toNum,
} from './utils/style'
export { actionTypes, trigger, triggers } from './constants'
export * from './types'

import { lib } from './constants'
export const dataAttributes = lib.dataAttributes

/* -------------------------------------------------------
  ---- TEMP exports - To be reworked
-------------------------------------------------------- */

export { default as ComponentPage } from './dom/factory/componentFactory/ComponentPage'
export { default as Global } from './dom/Global'
export { default as GlobalComponentRecord } from './dom/global/GlobalComponentRecord'
export { default as GlobalRecord } from './dom/global/GlobalRecord'
export { default as GlobalTimer } from './dom/global/Timer'
export { default as GlobalTimers } from './dom/global/Timers'
export { default as NDOM } from './dom/noodl-ui-dom'
export { default as NDOMPage } from './dom/Page'
export { default as NDOMResolver } from './dom/Resolver'

export { BASE_PAGE_URL, eventId } from './constants'
export {
  _DEV_,
  _TEST_,
  addClassName,
  asHtmlElement,
  getElementTag,
  findByClassName,
  findByDataAttrib,
  findByDataKey,
  findByElementId,
  findByGlobalId,
  findByPlaceholder,
  findBySelector,
  findBySrc,
  findByUX,
  findByViewTag,
  findFirstByClassName,
  findFirstByDataKey,
  findFirstByElementId,
  findFirstByGlobalId,
  findFirstBySelector,
  findFirstByViewTag,
  isDisplayable,
  isImageDoc,
  isMarkdownDoc,
  isNoteDoc,
  isPageConsumer,
  isPdfDoc,
  isTextDoc,
  isTextFieldLike,
  isWordDoc,
  makeElemFn,
  makeFindByAttr,
  makeFindFirstBy,
  normalizeEventName,
  openOutboundURL,
  posKeys,
  resourceTypes,
  toSelectOption,
  xKeys,
  yKeys,
} from './dom/utils'
export { default as findDocument } from './utils/findDocument'
export { default as findElement } from './utils/findElement'
export { default as findWindow } from './utils/findWindow'
export { default as findWindowDocument } from './utils/findWindowDocument'
export { default as isNDOMPage } from './utils/isNDOMPage'

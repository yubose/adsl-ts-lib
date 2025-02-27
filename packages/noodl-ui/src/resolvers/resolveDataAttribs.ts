// Resolve data attributes which get attached to the outcome as data-* properties
import * as u from '@jsmanifest/utils'
import get from 'lodash/get'
import { Identify } from 'noodl-types'
import { excludeIteratorVar, findDataValue, trimReference } from 'noodl-utils'
import {
  addDate,
  createGlobalComponentId,
  getStartOfDay,
} from '../utils/internal'
import Resolver from '../Resolver'
import log from '../utils/log'
import * as n from '../utils/noodl'
import { NuiComponent } from '../types'

const dataAttribsResolver = new Resolver('resolveDataAttribs')

dataAttribsResolver.setResolver(async (component, options, next) => {
  const original = component.blueprint || {}
  const { context, getAssetsUrl, getQueryObjects, getRoot, page } = options
  const {
    contentType,
    controls,
    dataKey,
    image,
    options: selectOptions,
    popUpView,
    path,
    poster,
    timeSlot,
    providerId,
    facilityId,
    locationId,
    resource,
    viewTag,
  } = original
  let prepareDocToPath:string|null = null
  const iteratorVar = context?.iteratorVar || n.findIteratorVar(component)
  
  if (Identify.component.listItem(component)) {
    // When redrawing a listItem the context must be customly injected back into the context via invoking resolveComponents directly, since by default the only way to receive this information is through rendering listItem children from the list parent
    if (!component.get(iteratorVar) && context?.dataObject) {
      component.edit(iteratorVar, context.dataObject)
      !u.isNil(context.index) && component.edit('index', context.index)
    }
  }

  /* -------------------------------------------------------
    ---- UI / VISIBILITY
  -------------------------------------------------------- */

  if (/(passwordHidden|messageHidden)/i.test(contentType)) {
    component.edit({ 'data-ux': contentType })
  } else if (/(vidoeSubStream|videoSubStream)/i.test(contentType)) {
    component.edit({ 'data-ux': contentType })
  } else if (contentType === 'timerLabelPopUp') {
    component.edit({ 'data-ux': contentType })
  }

  /* -------------------------------------------------------
  ---- GLOBALS
-------------------------------------------------------- */

  if (component.has('global')) {
    component.edit({ 'data-globalid': createGlobalComponentId(component) })
  }

  /* -------------------------------------------------------
    ---- POP UP
  -------------------------------------------------------- */

  if (Identify.component.popUp(original)) {
    component.edit({ 'data-ux': popUpView || viewTag })
  }

  /* -------------------------------------------------------
    ---- LISTS
  -------------------------------------------------------- */

  if (n.isListLike(component)) {
    component.edit({ 'data-listid': component.id })
  }

  /* -------------------------------------------------------
    ---- REFERENCES / DATAKEY
  -------------------------------------------------------- */

  if (u.isStr(dataKey)) {
    let result: any
    if (!Identify.folds.emit(dataKey)) {
      if (iteratorVar) {
        const listAttribute = n.getListAttribute(component)
        if (iteratorVar === dataKey) {
          result = context?.dataObject
        } else if (dataKey.startsWith('listAttr')) {
          result = get(
            listAttribute,
            excludeIteratorVar(dataKey, 'listAttr') as string,
          )
        } else {
          result = get(
            context?.dataObject,
            excludeIteratorVar(dataKey, iteratorVar) as string,
          )
        }
      }

      // Attempt a second round of querying in case its a local/root reference
      if (u.isUnd(result)) {
        result = findDataValue(
          getQueryObjects({
            component,
            page,
          }),
          excludeIteratorVar(dataKey, iteratorVar),
        )
      }

      if (u.isFnc(component.get('text=func'))) {
        if (contentType === 'timer') {
          const initialTime = getStartOfDay(new Date())
          result = addDate(initialTime, { seconds: result })
          result === null && (result = new Date())
        }
        if(result||![undefined,null,NaN].includes(result)){
          const cacheTime = component.get('cacheTime')
          const func = component.get('text=func')
          if(func.length>=2 && cacheTime){
            result = func?.(result,cacheTime)
          }else{
            result = func?.(result)
          }
          
        }else{
          result = component.get('text')
        }
      }

      //path=func
      if (
        Identify.component.image(component) ||
        Identify.component.video(component)
      ) {
        const func = component.get('path=func')
        const outBase64 = component.get('base64data')
        if (component.blueprint?.['path=func']) {

          if(func?.name === 'prepareChatDocToPath'){
            const root = getRoot()
            const func = root.builtIn.getCacheByKey
            const payload = {
              apiObject: {
                id: result,
                func: 'prepareDocToPath'
              },
            }
            const res = await func?.(payload)
            if(res && res?.url){
              prepareDocToPath = res.url
            }
          }
          if (component.get('wait')) {
            result = await func?.(result)
            if (!result) {
              result = outBase64? func?.(result,null,outBase64) : func?.(result)
            }
          } else {
            result = outBase64? func?.(result,null,outBase64) : func?.(result)
          }

        }
      }

      //___.message
      if (dataKey.startsWith('_')) {
        let fieldParts = dataKey?.split?.('.')
        const _field = fieldParts[0] as any
        const key = fieldParts[1]
        let parent: NuiComponent.Instance = component
        for (let i = 0; i < _field.length - 1; i++) {
          if (parent?.parent) {
            parent = parent.parent
          }
        }
        result = parent.props[key as any]
      }

      component.edit({ 'data-value': result })
    }

    // TODO - Deprecate this logic below for an easier implementation
    let fieldParts = dataKey?.split?.('.')
    let field = fieldParts?.shift?.() || ''
    let fieldValue = getRoot()?.[page?.page]?.[field]
    if (fieldParts?.length) {
      while (fieldParts.length) {
        field = (fieldParts?.shift?.() as string) || ''
        field = field[0]?.toLowerCase?.() + field.substring(1)
        fieldValue = fieldValue?.[field]
      }
    } else {
      field = fieldParts?.[0] || ''
    }

    component.edit(
      { 'data-key': dataKey, 'data-name': field },
      { remove: 'dataKey' },
    )
  }
  if (u.isStr(timeSlot)) {
    let result: any
    if (!Identify.folds.emit(timeSlot)) {
      if (iteratorVar) {
        const listAttribute = n.getListAttribute(component)
        if (iteratorVar === timeSlot) {
          result = context?.dataObject
        } else if (timeSlot.startsWith('listAttr')) {
          result = get(
            listAttribute,
            excludeIteratorVar(timeSlot, 'listAttr') as string,
          )
        } else {
          result = get(
            context?.dataObject,
            excludeIteratorVar(timeSlot, iteratorVar) as string,
          )
        }
      }
      component.edit({ 'data-timeSlot': result })
      }
  }
  if (u.isStr(providerId)) {
    let result: any
    if (!Identify.folds.emit(providerId)) {
      if (iteratorVar) {
        const listAttribute = n.getListAttribute(component)
        if (iteratorVar === providerId) {
          result = context?.dataObject
        } else if (providerId.startsWith('listAttr')) {
          result = get(
            listAttribute,
            excludeIteratorVar(providerId, 'listAttr') as string,
          )
        } else {
          result = get(
            context?.dataObject,
            excludeIteratorVar(providerId, iteratorVar) as string,
          )
        }
      }
      component.edit({ 'data-providerId': result })
      }
  }
  if (u.isStr(facilityId)) {
    let result: any
    if (!Identify.folds.emit(facilityId)) {
      if (iteratorVar) {
        const listAttribute = n.getListAttribute(component)
        if (iteratorVar === facilityId) {
          result = context?.dataObject
        } else if (facilityId.startsWith('listAttr')) {
          result = get(
            listAttribute,
            excludeIteratorVar(facilityId, 'listAttr') as string,
          )
        } else {
          result = get(
            context?.dataObject,
            excludeIteratorVar(facilityId, iteratorVar) as string,
          )
        }
      }
      component.edit({ 'data-facilityId': result })
      }
  }
  if (u.isStr(locationId)) {
    let result: any
    if (!Identify.folds.emit(locationId)) {
      if (iteratorVar) {
        const listAttribute = n.getListAttribute(component)
        if (iteratorVar === locationId) {
          result = context?.dataObject
        } else if (locationId.startsWith('listAttr')) {
          result = get(
            listAttribute,
            excludeIteratorVar(locationId, 'listAttr') as string,
          )
        } else {
          result = get(
            context?.dataObject,
            excludeIteratorVar(locationId, iteratorVar) as string,
          )
        }
      }
      component.edit({ 'data-locationId': result })
      }
  }

  /* -------------------------------------------------------
    ---- ARBITRARY PROP TRANSFORMING
  -------------------------------------------------------- */
  for (const [key = '', value] of component) {
    // Check the value if they are a string and are a reference
    if (u.isStr(value)) {
      /* -------------------------------------------------------
        ---- REFERENCES
      -------------------------------------------------------- */
      if (Identify.reference(value)) {
        if (key === 'style') {
          u.assign(
            component.style,
            n.parseReference(value, { page: page?.page, root: getRoot() }),
          )
        }else if(key === 'data-value' && Identify.reference(value) ){
          component.edit({[key]:''})
        }else {
          component.edit(
            n.parseReference(value, { page: page?.page, root: getRoot() }),
          )
        }
      }
    }
  }

  //

  /* -------------------------------------------------------
    ---- MEDIA
  -------------------------------------------------------- */

  if (poster) {
    component.edit({ poster: n.resolveAssetUrl(poster, getAssetsUrl()) })
  }

  Identify.isBoolean(controls) &&
    component.edit({ controls: Identify.isBooleanTrue(controls) })

  // Images / Plugins / Videos
  if (path || resource || image) {
    let src = ''

    if (u.isStr(path)) src = prepareDocToPath || path
    else if (u.isStr(resource)) src = resource
    else if (u.isStr(image)) src = image
    // Path emits are handled in resolveActions
    if (u.isStr(src)) {
      if (Identify.reference(src)) {
        if (src.startsWith('..')) {
          // Local
          src = src.substring(2)
          src = get(getRoot()[options?.page?.page], src)
        } else if (src.startsWith('.')) {
          // Root
          src = src.substring(1)
          src = get(getRoot(), src)
        }
      }

      if (iteratorVar && src.startsWith(iteratorVar)) {
        src = excludeIteratorVar(src, iteratorVar) || ''
        src = get(context?.dataObject, src) || ''

        if (u.isStr(src) && !src.startsWith(getAssetsUrl())) {
          src = getAssetsUrl() + src
        }

        // TODO - Deprecate "data-src" in favor of data-value
        component.edit({ 'data-src': src, src })
        path && component.emit('path', src)
        image && component.emit('image', src)
      } else {
        if (src) {
          src = n.resolveAssetUrl(src, getAssetsUrl())
          component.edit({ 'data-src': src, path: src })
          // Wrapping this in a setTimeout allows DOM elements to subscribe
          // their callbacks before this fires
          const timer = setTimeout(() => {
            // TODO - Deprecate "src" in favor of data-value
            path && component.emit('path', src)
            image && component.emit('image', src)
            clearTimeout(timer)
          })
        }
      }
    }
  }

  /* -------------------------------------------------------
    ---- SELECT
  -------------------------------------------------------- */

  if (Identify.component.select(component)) {
    // Receiving their options by reference
    if ([dataKey, selectOptions].find((v) => v && u.isStr(v))) {
      let dataOptions = selectOptions
      if (u.isStr(selectOptions)) {
        if (iteratorVar && selectOptions.startsWith(iteratorVar)) {
          const dataOptionsKey = excludeIteratorVar(selectOptions, iteratorVar)
          dataOptions = dataOptionsKey
            ? get(n.findListDataObject(component), dataOptionsKey)
            : n.findListDataObject(component)
        } else {
          const dataOptionsKey = trimReference(selectOptions)
          dataOptions = get(
            Identify.localKey(dataOptionsKey)
              ? getRoot()[page.page]
              : getRoot(),
            dataOptionsKey,
          )
        }
      }
      let dataPath = dataKey && u.isStr(dataKey) ? dataKey : selectOptions
      let isListPath = !!(iteratorVar && dataPath.startsWith(iteratorVar))
      if (!u.isArr(dataOptions)) {
        if (isListPath) {
          dataPath = excludeIteratorVar(dataPath, iteratorVar)
          dataOptions = dataPath
            ? get(n.findListDataObject(component), dataPath)
            : n.findListDataObject(component)
        } else {
          dataPath = trimReference(dataPath)
          dataOptions = get(
            Identify.localKey(dataPath) ? getRoot()[page.page] : getRoot(),
            dataPath,
          )
        }
      }

      if (dataOptions) {
        component.set('data-options', dataOptions || [])
        const timer = setTimeout(() =>{
          component.emit('options', component.get('data-options'))
          clearTimeout(timer)
        },)
      } else {
        log.error(
          `%cCould not find the list of options for a select component using the path "${selectOptions}"`,
          `color:#ec0000;`,
          component,
        )
      }
    }
  }

  /* -------------------------------------------------------
    ---- OTHER
  -------------------------------------------------------- */
  // Hardcoding / custom injecting these for now
  if (viewTag) {
    component.edit({ 'data-viewtag': viewTag })
    if (
      /(mainStream|selfStream|subStream|camera|microphone|hangUp|inviteOthers)/i.test(
        viewTag,
      )
    ) {
      component.edit({ 'data-ux': viewTag })
    } else {
      // TODO convert others to use data-view-tag
      component.edit('data-viewtag', viewTag)
      if (!component.get('data-ux')) component.edit({ 'data-ux': viewTag })
    }
  }

  return next?.()
})

export default dataAttribsResolver

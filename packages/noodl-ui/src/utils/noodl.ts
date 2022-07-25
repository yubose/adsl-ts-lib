import * as u from '@jsmanifest/utils'
import { evalIf as _evalIf, excludeIteratorVar,toDataPath,trimReference } from 'noodl-utils'
import type { ComponentObject, IfObject } from 'noodl-types'
import { Identify } from 'noodl-types'
import get from 'lodash/get'
import isComponent from './isComponent'
import log from '../utils/log'
import is from '../utils/is'
import type { NuiComponent } from '../types'


export function getListAttribute(component: NuiComponent.Instance){
  let dataObject:any
  let listAttribute:any
  let index:number
  let parentIndex
  let parent: any
  let listItem: any
  if (Identify.component.listItem(component)) {
    listItem = component
  } else {
    listItem = findParent(component, Identify.component.listItem)
  }

  if(Identify.component.listItem(listItem)){
    let iteratorVar = findIteratorVar(listItem)
    let listIndex = u.isNum(listItem.get('index'))
                    ? listItem.get('index')
                    : listItem.get('listIndex')
    index = listIndex?listIndex:0
    const list = listItem.parent
    if(isComponent(list)){
      dataObject =
        list.blueprint.listObject || list.get('listObject')  
      // dataObject = list.get('listObject')
    }

    if(
      u.isStr(dataObject) &&
      dataObject.startsWith('itemObject')&&
      isComponent(list)
    ){
      const parentItem = list.parent
      if(isComponent(parentItem)){
        parentIndex = u.isNum(parentItem.get('index'))
                      ? parentItem.get('index')
                      : parentItem.get('listIndex')
        parentIndex = parentIndex ? parentIndex : 0
        let dataKey: any = dataObject.toString()
        dataKey = excludeIteratorVar(dataKey, iteratorVar)
        parent = findListDataObject(parentItem)
        dataObject = get(parent,dataKey)
      }
      
    }
    if(u.isArr(dataObject)){
      listAttribute = {
        length: dataObject.length,
        index: index+1,
        dataObject: dataObject,
      }
      if(u.isNum(parentIndex)){
        listAttribute['parentIndex']= parentIndex+1
        listAttribute['parent'] = parent
      }
    }
  }
  
  return listAttribute || null
  
}

export function evalIf<O extends IfObject>(val: O) {
  const [value, valTrue, valFalse] = val?.if || []
  if (Identify.isBoolean(value)) {
    return Identify.isBooleanTrue(value) ? valTrue : valFalse
  }
  if (u.isFnc(value)) return value() ? valTrue : valFalse
  if (value) return valTrue
  return valFalse
}

export function getByRef(root = {}, ref = '', rootKey = '') {
  if (is.localReference(ref)) {
    if (rootKey) return get(root[rootKey], toDataPath(trimReference(ref)))
  } else if (is.rootReference(ref)) {
    return get(root, toDataPath(trimReference(ref)))
  }
  return ref
}

/**
 * Traverses the parent hierarchy, running the comparator function in each
 * iteration. If a callback returns true, the node in that iteration will become
 * the returned parent
 * @param { NuiComponent.Instance } component
 * @param { function } fn
 */
export function findParent<C extends NuiComponent.Instance>(
  component: C | undefined,
  fn: (parent: NuiComponent.Instance | null) => boolean,
) {
  if (!component) return null
  let parent = component?.parent as NuiComponent.Instance
  if (fn(parent)) return parent
  while (parent) {
    if (fn(parent.parent)) return parent.parent
    parent = parent.parent as NuiComponent.Instance
  }
  return parent || null
}

export function findListDataObject(
  component: NuiComponent.Instance | Record<string, any> | undefined,
) {
  if (!isComponent(component) || !isListConsumer(component)) return null

  let dataObject
  let listItem: any
  let iteratorVar = findIteratorVar(component)

  if (Identify.component.listItem(component)) {
    listItem = component
  } else {
    listItem = findParent(component, Identify.component.listItem)
  }

  if (isComponent(listItem)) {
    if (iteratorVar && listItem.props[iteratorVar]) {
      return listItem.props[iteratorVar]
    }

    let list = listItem.parent
    let listIndex = u.isNum(listItem.get('index'))
      ? listItem.get('index')
      : listItem.get('listIndex')
    listIndex = listIndex?listIndex:0

    if (isComponent(list)) {
      if (Identify.component.listItem(component)) {
        dataObject = listItem.get(iteratorVar)
      } else {
        dataObject = list.get('listObject')?.[listIndex]
      }
    }
    if (!dataObject && u.isNum(listIndex)) {
      const listObject = isComponent(list)
        ? list.blueprint?.listObject
        : undefined
      listObject?.length && (dataObject = listObject[listIndex])
    }
  }
  return dataObject || null
}

export function findIteratorVar(
  component: NuiComponent.Instance | Record<string, any> | undefined,
): string {
  if (isComponent(component)) {
    if (Identify.component.list(component)) {
      return component.blueprint?.iteratorVar || ''
    }
    return (
      findParent(component, (p) => Identify.component.list(p))?.blueprint
        ?.iteratorVar || ''
    )
  }
  return ''
}

export function flatten(
  component: NuiComponent.Instance | undefined,
): NuiComponent.Instance[] {
  if (!component) return []
  const children = [component] as NuiComponent.Instance[]
  publish(component, (child) => children.push(child))
  return children
}

/**
 * Returns the element nodes of data keys. If dataKeys is not provided it will
 *    return all of the matching nodes by default. If provided, it will return only
 *    the nodes of the data keys that were given
 * @param { string | string[] | undefined } dataKeys
 */
export function getDataFields(
  dataKeys?: string | string[],
): { [key: string]: HTMLElement | null } | undefined {
  if (typeof window !== 'undefined') {
    if (dataKeys) {
      // Ensure that it is an array
      if (typeof dataKeys === 'string') dataKeys = [dataKeys]

      return u.isArr(dataKeys)
        ? dataKeys.reduce((acc, dataKey) => {
            acc[dataKey] = document.querySelector(`[data-key="${dataKey}"]`)
            return acc
          }, {})
        : []
    }
    const result = {}
    const nodeList = document.querySelectorAll('[data-key]')
    if (nodeList) {
      nodeList.forEach((node) => {
        const dataset = node['dataset']
        if (dataset['key'] && dataset['name']) {
          result[dataset.name] = document.querySelector(
            `[data-key="${dataset.key}"]`,
          )
        } else {
          log.error(
            `%cInvalid data name and/or data key`,
            'color:#e74c3c;font-weight:bold;',
            { dataset, node },
          )
        }
      })
    }
    return result
  }
}

/**
 * Extracts the value from the node and returns it
 *    If node is a string, it will assume it is a data key and use it to retrieve the node
 * @param { string | Element } node - Data key or the element node
 */

function getDataValue(node: string | null | Element): string | number | null {
  if (node) {
    if (typeof node === 'string') {
      const dataKey = node
      node = document.querySelector(`[data-key="${dataKey}"]`)
    }
    if (node instanceof Element) {
      switch (node.constructor.name) {
        case 'HTMLInputElement':
        case 'HTMLSelectElement':
        case 'HTMLTextAreaElement':
          return (
            node as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
          ).value
        case 'HTMLButtonElement':
          log.error(
            `%c[getDataValue] ` +
              `Tried to retrieve a data value from a button element but there ` +
              `is no implementation for it. Perhaps it needs to be supported?`,
            'color:#e74c3c;font-weight:bold;',
            { node },
          )
          break
        default:
          break
      }
    }
  }
  return ''
}

/**
 *
 * @param { string[] | object } nodes - String of data keys
 */
export function getDataValues<Fields, K extends keyof Fields>(
  nodes?: K[] | Fields,
) {
  const result = {} as { [P in keyof Fields]: Fields[P] }
  let fn

  // Array of field keys
  if (u.isArr(nodes)) {
    fn = (name: K) => (result[name as string] = getDataValue(name as string))
    nodes.forEach(fn)
  }
  // Object of nodes where key is the data name and value is an HTMLElement
  else if (u.isObj(nodes)) {
    fn = (name: string) => (result[name] = getDataValue(nodes?.[name] || ''))
    Object.keys(nodes || {}).forEach(fn)
  }
  // If they don't pass in any arguments, do a global query for all nodes
  // that are assigned a custom data-name attribute
  else if (!arguments.length) {
    const allNodes = getDataFields()
    if (allNodes) {
      fn = (key: string) => {
        const node = allNodes[key]
        if (node) {
          result[key] = getDataValue(node)
        } else {
          log.error(
            `%c[getDataValues] ` +
              `Attempted to find a node for key ${key} but received null or ` +
              `undefined. The program should not have gotten here`,
            'color:#e74c3c;font-weight:bold;',
            { allNodes, node, key },
          )
        }
      }
      Object.keys(allNodes).forEach(fn)
    }
  } else {
    log.error(
      `%c[getDataValues] ` + `nodes is not an array or object`,
      'color:#e74c3c;font-weight:bold;',
      nodes,
    )
    return result
  }

  return result
}

export function getPluginLocation(
  obj: NuiComponent.Instance | ComponentObject | string | undefined,
) {
  let type: string | undefined
  // if (typeof obj === 'string') type = obj
  // else type = obj.type
  if (type) {
    switch (type) {
      case 'pluginBodyTop':
        return 'body-top'
      case 'pluginBodyTail':
        return 'body-bottom'
    }
  }
  return 'head'
}

export function isListConsumer(
  component: unknown,
): component is NuiComponent.Instance {
  if (!isComponent(component)) return false
  return !!findIteratorVar(component)
}

export function isListLike(component: NuiComponent.Instance) {
  return component.type === 'chatList' || component.type === 'list'
}

export function parseReference(
  ref: string,
  { page = '', root = {} }: { page?: string; root?: any },
) {
  let trimmedPath = ref.replace(/(\.\.|\.)/, '')
  // Local/private reference
  if (ref[0] === ref[0].toLowerCase()) {
    return get(root?.[page], trimmedPath)
  }
  // Global reference
  if (ref[0] === ref[0].toUpperCase()) {
    return get(root, trimmedPath)
  }
  return ''
}

export function pullFromComponent(
  key: string | undefined,
  component: NuiComponent.Instance | undefined | null,
) {
  if (!key || !isComponent(component)) return null
  return (
    component.get(key) ||
    component[key] ||
    ((component.has(key) || component.props?.[key]) &&
      component.blueprint?.[key]) ||
    null
  )
}

export function find(
  key: string | string[] | undefined,
  component: NuiComponent.Instance | null | undefined,
) {
  const keys = u.array(key)
  const numKeys = keys.length
  for (let index = 0; index < numKeys; index++) {
    const k = keys[index]
    const value = pullFromComponent(k, component)
    if (value != undefined) return value
  }
}

/**
 * Recursively invokes the provided callback on each child.
 * @param { NuiComponent.Instance } component
 * @param { function } cb
 */
export function publish(
  cb: (child: NuiComponent.Instance) => void,
  component: NuiComponent.Instance | undefined,
): void
export function publish(
  component: NuiComponent.Instance | undefined,
  cb: (child: NuiComponent.Instance) => void,
): void
export function publish(
  component:
    | NuiComponent.Instance
    | ((child: NuiComponent.Instance) => void)
    | undefined,
  cb:
    | ((child: NuiComponent.Instance) => void)
    | NuiComponent.Instance
    | undefined,
) {
  let _component: NuiComponent.Instance | undefined
  let _cb: ((child: NuiComponent.Instance) => void) | undefined

  if (u.isFnc(component)) {
    _component = cb as NuiComponent.Instance
    _cb = component
  } else {
    _component = component
    _cb = cb as (child: NuiComponent.Instance) => void
  }

  if (_component && u.isArr(_component.children)) {
    for (const child of _component.children) {
      _cb?.(child)
      _cb && publish(child, _cb)
    }
  }

  _component = undefined
  _cb = undefined
}

// TODO - This overload doesn't work when doing resolveAssetUrl("SquarePayment.html", { assetsUrl: getAssetsUrl() })
export function resolveAssetUrl(
  pathValue: string | undefined,
  opts: {
    assetsUrl?: string
    dataObject?: Record<string, any>
    dataKey?: string
    iteratorVar?: string
  },
): string

export function resolveAssetUrl(
  pathValue: string | undefined,
  assetsUrl: string,
): string

export function resolveAssetUrl(
  pathValue: string | undefined,
  options:
    | string
    | {
        assetsUrl?: string
        dataObject?: Record<string, any>
        dataKey?: string
        iteratorVar?: string
      },
) {
  let assetsUrl = ''
  let src = ''

  if (u.isStr(options)) {
    assetsUrl = options
    if (!pathValue) return assetsUrl || ''
    if (u.isStr(pathValue)) {
      if (/^(http|blob)/i.test(pathValue)) src = pathValue
      else if (pathValue.startsWith('~/')) {
        // Should be handled by an SDK
      } else src = assetsUrl + pathValue
    } else src = `${assetsUrl}${pathValue}`
  } else if (u.isObj(options)) {
    // TODO - Fix this
    src = pathValue || ''
    let { dataObject, iteratorVar = '' } = options
    if (u.isStr(src)) {
      if (src.startsWith('http')) return src
      if (u.isObj(dataObject) && u.isStr(iteratorVar)) {
        if (iteratorVar && src.startsWith(iteratorVar)) {
          src = excludeIteratorVar(src, iteratorVar) || ''
        }
        src = get(dataObject, src)
        if (u.isStr(src)) {
          if (/^(http|blob)/i.test(src)) src = src
          else if (src.startsWith('~/')) {
            // Should be handled by an SDK
          } else src = `${assetsUrl}${src}`
        } else src = `${assetsUrl}${src}`
      }
    }
  }

  return src
}

export function unwrapObj(obj: any) {
  return typeof obj === 'function' ? obj() : obj
}

import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import unary from 'lodash/unary'
import type { ActionChainObserver } from 'noodl-action-chain'
import type { OrArray } from '@jsmanifest/typefest'
import merge from 'lodash/merge'
import get from 'lodash/get'
import set from 'lodash/set'
import { isActionChain } from 'noodl-action-chain'
import {
  createEmitDataKey,
  evalIf,
  excludeIteratorVar,
  trimReference,
} from 'noodl-utils'
import type ActionsCache from './cache/ActionsCache'
import EmitAction from './actions/EmitAction'
import createAction from './utils/createAction'
import createActionChain from './utils/createActionChain'
import createComponent from './utils/createComponent'
import getActionType from './utils/getActionType'
import getActionObjectErrors from './utils/getActionObjectErrors'
import isComponent from './utils/isComponent'
import isPage from './utils/isPage'
import isViewport from './utils/isViewport'
import NuiPage from './Page'
import Transformer from './Transformer'
import VP from './Viewport'
import {
  findIteratorVar,
  findListDataObject,
  getListAttribute,
  getPluginLocation,
  isListConsumer,
  resolveAssetUrl,
} from './utils/noodl'
import log from './utils/log'
import { groupedActionTypes, nuiEmitType } from './constants'
import { isUnitTestEnv } from './utils/common'
import isNuiPage from './utils/isPage'
import cache from './_cache'
import * as i from './utils/internal'
import * as t from './types'

const NUI = (function () {
  let _getRoot: () => Record<string, any>

  const _hooks = new Map<keyof t.On, t.On[keyof t.On][]>()

  /**
   * Determining on the type of value, this performs necessary clean operations to ensure its resources that are bound to it are removed from memory
   * @param value
   */
  function _clean(
    page: NuiPage,
    onClean?: (stats?: { componentsRemoved: number }) => void,
  ): void
  function _clean(
    value: NuiPage,
    onClean?: (stats?: { componentsRemoved: number }) => void,
  ) {
    if (isPage(value)) {
      const currentPage = value.page
      if (currentPage) {
        let componentsRemoved = 0
        for (const obj of cache.component) {
          if (obj) {
            if (obj.page === currentPage) {
              cache.component.remove(obj.component)
              componentsRemoved++
            }
          }
        }
        onClean?.({ componentsRemoved })
      }
      cache.page.remove(value)
    }
  }

  /**
   * Creates a Component from either:
   * 1. Component type
   * 2. Component object
   * 3. Existing component instance
   *
   * The Component and the current page name will be added to the ComponentCache
   * @param { t.NuiComponentType | t.NuiComponent.Instance | nt.ComponentObject } componentObject
   * @param { NuiPage | undefined } page
   */
  function _createComponent(
    componentObject:
      | t.NuiComponentType
      | t.NuiComponent.Instance
      | nt.ComponentObject
      | null
      | undefined,
    page: NuiPage,
  ) {
    let component: t.NuiComponent.Instance
    if (isComponent(componentObject)) {
      component = componentObject
    } else {
      component = createComponent(componentObject as nt.ComponentObject)
    }
    !cache.component.has(component) &&
      cache.component.add(component, page || o.getRootPage())
    return component
  }

  function _gotoFactory() {
    const fns = [] as t.GotoFn[]
    return (fn: t.GotoFn) => {
      fns.push(fn)
      return (args: Parameters<t.GotoFn>[0]) => {
        return fns.map((fn) => fn?.(args))
      }
    }
  }

  const _createGoto = _gotoFactory()

  /**
   *  Create a url
   * @param { function } createSrc
   */
  async function _createSrc(args: {
    key: string
    value: nt.Path
    component: t.NuiComponent.Instance
    page: NuiPage
  }): Promise<string>
  async function _createSrc(
    path: nt.Path,
    opts?: {
      component: t.NuiComponent.Instance
      context?: Record<string, any>
    },
  ): Promise<string>
  async function _createSrc(
    path: nt.IfObject,
    opts?: {
      component?: t.NuiComponent.Instance
      page?: NuiPage
    },
  ): Promise<string>
  async function _createSrc(path: string): Promise<string>
  async function _createSrc(
    args:
      | nt.EmitObjectFold
      | nt.IfObject
      | {
          context?: Record<string, any>
          component: t.NuiComponent.Instance
          page: NuiPage
        }
      | string,
    opts?:
      | {
          component?: t.NuiComponent.Instance
          context?: Record<string, any>
          page?: NuiPage
        }
      | {
          on: NonNullable<t.ResolveComponentOptions<any>['on']>
          key?: string
          component?: t.NuiComponent.Instance
          page?: NuiPage
        },
  ) {
    let component: t.NuiComponent.Instance | undefined
    let page: NuiPage = o.getRootPage()

    if (u.isStr(args)) {
      // Components of type "page" can have a path that points directly to a page
      // ex: path: "LeftPage"
      if ([...o.getPages(), ...o.getPreloadPages()].includes(args)) {
        const pageLink = o.getBaseUrl() + args + '_en.yml'
        component?.emit?.('path', pageLink)
        return pageLink
      }
      return resolveAssetUrl(args, o.getAssetsUrl())
    } else if (u.isObj(args)) {
      if (nt.Identify.folds.emit(args)) {
        component = opts?.component as t.NuiComponent.Instance
        // TODO - narrow this query to avoid only using the first encountered obj
        const obj = o.cache.actions.emit.get('path')?.[0]
        const iteratorVar =
          (opts as any)?.context?.iteratorVar || findIteratorVar(component)
        if (u.isFnc(obj?.fn)) {
          const emitAction = new EmitAction('path', args)
          if ('dataKey' in args.emit) {
            emitAction.dataKey = createEmitDataKey(
              args.emit.dataKey as string,
              _getQueryObjects({
                component,
                page,
                listDataObject: (opts as any)?.dataObject,
              }),
              { iteratorVar },
            )
          }
          emitAction.executor = async function () {
            const callbacks = (o.cache.actions.emit.get('path') || []).reduce(
              (acc, obj) =>
                obj?.trigger === 'path' ? acc.concat(obj as any) : acc,
              [],
            )
            if (!callbacks.length) return ''
            const result = await Promise.race(
              callbacks.map(async (obj: t.Store.ActionObject) =>
                obj.fn?.(
                  emitAction,
                  o.getConsumerOptions({
                    component,
                    on: (opts as any)?.on,
                    page,
                    path: args,
                  }),
                ),
              ),
            )
            return (u.isArr(result) ? result[0] : result) || ''
          }
          // Result returned should be a string type
          let result = (await emitAction.execute.call(emitAction, args)) as
            | string
            | Promise<string>

          if (u.isStr(result)) {
            if (!result.startsWith('http')) {
              result = resolveAssetUrl(result, o.getAssetsUrl())
            }
            component?.emit?.('path', result)
            return result
          }
        }
      } else if (nt.Identify.if(args)) {
        if (u.isObj(opts) && 'on' in opts && opts.on.if) {
          return opts.on?.if({
            key: opts.key || '',
            component: opts.component,
            page: opts.page || page,
            value: args,
          })
        }
        return resolveAssetUrl(
          evalIf((val: any) => {
            if (nt.Identify.isBoolean(val))
              return nt.Identify.isBooleanTrue(val)
            if (u.isFnc(val)) {
              if (component) return val(findListDataObject(component))
              return val()
            }
            return !!val
          }, args as nt.IfObject),
          o.getAssetsUrl(),
        )
      } else {
      }
    }
  }

  // @ts-expect-error
  async function _emit<Evt extends string = string>(
    opts?: t.NUIEmit.EmitRegister<Evt>,
  ): Promise<any[]>

  async function _emit<Tid extends t.TransactionId = t.TransactionId>(
    obj?: t.NUIEmit.EmitTransaction<Tid>,
  ): Promise<Parameters<t.Transaction[Tid]['callback']>[0]>

  async function _emit<
    Evt extends string = string,
    Tid extends t.TransactionId = t.TransactionId,
  >(opts: t.NUIEmit.EmitRegister<Evt> | t.NUIEmit.EmitTransaction<Tid>) {
    try {
      if (opts.type === nuiEmitType.REGISTER) {
        const { event, params } = opts
        if (cache.register.has(event)) {
          const results = [] as any[]
          const obj = cache.register.get(event)
          if (obj.handler) {
            const callback = obj.handler.fn
            if (u.isFnc(callback)) {
              log.debug(
                `%cThe callback exists in the handler object. It will be invoked`,
                `color:#95a5a6;`,
              )
              const result = await callback?.(obj, opts.params)
              results.push(result)
              const transactionHandler = o.cache.transactions.getHandler(
                'register',
                event,
              )
              u.isFnc(transactionHandler) && (await transactionHandler(result))
            }
            return results
          } else {
            log.debug(
              `%cA handler object did not exist. A default function will be used that calls the functions in the callbacks list by default`,
              `color:#95a5a6;`,
            )
            // TODO - Refactor this awkward code
            return obj.fn?.(obj, params as t.Register.ParamsObject)
          }
        } else {
          log.debug(
            `%cWarning: Emitted a register object that was not in the store`,
            `color:#FF5722;`,
            opts,
          )
        }
      } else if (opts.type === nuiEmitType.TRANSACTION) {
        return cache.transactions.get(opts.transaction)?.fn?.(opts.params)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      log.error(err)
      throw err
    }
  }

  function _createGetter(page?: NuiPage) {
    return function _get(
      key = '',
      {
        dataObject,
        iteratorVar = '',
        // They can optionally provide another page instance to override the page given above when determining the page name
        page: priorityPage,
        pageObject,
      }: {
        dataObject?: any
        iteratorVar?: string
        page?: NuiPage
        pageObject?: nt.PageObject
      } = {},
    ) {
      let _path = key
      const pageName = priorityPage?.page || page?.page || ''

      if (u.isStr(_path)) {
        if (nt.Identify.reference(_path)) {
          _path = trimReference(_path)
          if (nt.Identify.localKey(_path)) {
            return get(pageObject || o.getRoot()?.[pageName], _path)
          } else if (nt.Identify.rootKey(_path)) {
            return get(o.getRoot(), _path)
          }
        }

        if (iteratorVar) {
          if (_path.startsWith(iteratorVar)) {
            _path = excludeIteratorVar(_path, iteratorVar) || ''
            if (!dataObject) {
              log.debug(
                `%cAttempting to retrieve a value from a list data object but a data object was not provided. This may result in an unexpected value being returned`,
                `color:#ec0000;`,
              )
            }
            return get(
              dataObject ||
                pageObject ||
                o.getRoot()?.[pageName] ||
                o.getRoot(),
              _path,
            )
          }
        }

        if (_path[0].toLowerCase() === _path[0]) {
          const value = get(dataObject, _path)
          return !u.isUnd(value) ? value : get(o.getRoot()?.[pageName], _path)
        }

        const value = get(dataObject, _path)
        if (!u.isUnd(value)) return value
        return get(o.getRoot(), _path)
      }
    }
  }

  function _getQueryObjects(
    opts: {
      component?: t.NuiComponent.Instance
      page?: NuiPage
      queries?: () => Record<string, any> | (() => Record<string, any>)[]
      listDataObject?: any
    } = {},
  ) {
    const queries = [] as any[]
    // Query for a list data object
    if (opts?.component) {
      if (isListConsumer(opts.component)) {
        const dataObject =
          opts?.listDataObject || findListDataObject(opts.component)
        if (dataObject) {
          queries.push(dataObject)
        } else {
          log.debug(
            `%cCould not find a data object for a list consumer "${opts.component.type}" component`,
            `color:#ec0000;`,
            opts.component,
          )
        }
      }
    }
    // Page object
    opts?.page && queries.push(() => o.getRoot()[opts.page?.page || ''])
    // Root object
    queries.push(() => o.getRoot())
    opts?.queries && u.array(opts.queries).forEach((q) => queries.unshift(q))
    return queries
  }

  const _transformer = new Transformer()

  async function _resolveComponents<
    C extends OrArray<t.NuiComponent.CreateType>,
    Context extends Record<string, any> = Record<string, any>,
  >(
    opts: t.ResolveComponentOptions<C, Context>,
  ): Promise<
    C extends C[] ? t.NuiComponent.Instance[] : t.NuiComponent.Instance
  >

  async function _resolveComponents<
    C extends OrArray<t.NuiComponent.CreateType>,
    Context extends Record<string, any> = Record<string, any>,
  >(
    component: C,
    page?: NuiPage,
  ): Promise<
    C extends C[] ? t.NuiComponent.Instance[] : t.NuiComponent.Instance
  >

  async function _resolveComponents<
    C extends OrArray<t.NuiComponent.CreateType>,
    Context extends Record<string, any> = Record<string, any>,
  >(
    component: C,
    options?: Omit<t.ResolveComponentOptions<C, Context>, 'component'>,
  ): Promise<
    C extends C[] ? t.NuiComponent.Instance[] : t.NuiComponent.Instance
  >

  async function _resolveComponents<
    C extends OrArray<t.NuiComponent.CreateType>,
    Context extends Record<string, any> = Record<string, any>,
  >(
    arg1: C | t.ResolveComponentOptions<C, Context>,
    arg2?: NuiPage | Omit<t.ResolveComponentOptions<C, Context>, 'component'>,
  ) {
    let isArr = true
    let resolvedComponents: t.NuiComponent.Instance[] = []
    let components: t.NuiComponent.CreateType[] = []
    let page: NuiPage | undefined
    let context: Record<string, any> = {}
    let callback: t.ResolveComponentOptions<C, Context>['callback'] | undefined
    let on: t.ResolveComponentOptions<C, Context>['on'] | undefined
    let otherOpts = {} as { keepVpUnit?: boolean }

    if (u.isArr(arg1)) {
      components = arg1
      if (isNuiPage(arg2)) {
        page = arg2
      } else if (u.isObj(arg2)) {
        arg2.callback && (callback = arg2.callback)
        arg2.context && (context = arg2.context)
        arg2.page && (page = arg2.page)
        arg2.on && (on = arg2.on)
        if (arg2.keepVpUnit) otherOpts.keepVpUnit = arg2.keepVpUnit
      }
    } else if (u.isObj(arg1)) {
      if ('type' in arg1 || 'children' in arg1 || 'style' in arg1) {
        components = [arg1]
        if (isNuiPage(arg2)) {
          page = arg2
        } else if (u.isObj(arg2)) {
          isNuiPage(arg2.page) && (page = arg2.page)
          arg2.context && (context = arg2.context)
          arg2.callback && (callback = arg2.callback)
          arg2.on && (on = arg2.on)
        }
        isArr = false
      } else {
        arg1.callback && (callback = arg1.callback)
        arg1.context && u.assign(context, arg1.context)
        arg1.page && (page = arg1.page)
        arg1.on && (on = arg1.on)
        components = u.array(arg1.components)
        isArr = u.isArr(arg1.components)
        if (arg1.keepVpUnit) otherOpts.keepVpUnit = arg1.keepVpUnit
      }
    }

    async function xform(
      c: t.NuiComponent.Instance,
      {
        callback,
        context,
        on,
        page,
        ...otherOptions
      }: {
        callback?: t.ResolveComponentOptions<C, Context>['callback']
        context?: Record<string, any>
        on?: t.ResolveComponentOptions<C, Context>['on']
        page: NuiPage
      } & typeof otherOpts,
    ) {
      const options = o.getConsumerOptions({
        callback,
        component: c,
        context,
        on,
        page,
        ...otherOptions,
      })
      await _transformer.transform(c, options)
      const iteratorVar = context?.iteratorVar || ''
      const isListConsumer = iteratorVar && u.isObj(context?.dataObject)

      for (const [key, value] of u.entries(c.props)) {
        if (key === 'style') {
          // TODO - Put these finalizers into a curry utility func. This is temp. hardcoded for now
          if (isListConsumer) {
            if (u.isObj(value)) {
              for (let [styleKey, styleValue] of u.entries(value)) {
                // if (u.isStr(value) && vpHeightKeys.includes(key as any)) {
                if (u.isStr(styleValue)) {
                  if (styleValue.startsWith(iteratorVar)) {
                    const dataKey = excludeIteratorVar(
                      styleValue,
                      iteratorVar,
                    ) as string
                    const cachedValue = styleValue
                    styleValue = get(context?.dataObject, dataKey)
                    if (styleValue) {
                      c.edit({ style: { [styleKey]: styleValue } })
                    } else {
                      log.debug(
                        `%cEncountered an unparsed style value "${cachedValue}" for style key "${styleKey}"`,
                        `color:#ec0000;`,
                        { component: c, possibleValue: styleValue },
                      )
                    }
                  } else if (nt.Identify.reference(styleValue)) {
                    log.debug(
                      `%cEncountered an unparsed style value "${styleValue}" for style key "${styleKey}"`,
                      `color:#ec0000;`,
                      c,
                    )
                  }
                }
                // }
              }
            }
          }
        } else {
          if (nt.Identify.reference(value)) {
            // Do one final check for the "get" method, since some custom getters are defined on component.get() even though it returns the same component object when using component.props
            if (nt.Identify.reference(c.get(key))) {
              log.debug(
                `%cEncountered an unparsed reference value "${value}" for key "${key}"`,
                `color:#ec0000;`,
                c,
              )
              key === 'data-value' &&
                (nt.Identify.rootReference(value) ||
                  nt.Identify.localReference(value)) &&
                c.edit({ [key]: '' })
            }
          }
        }
      }
      return {
        component: c,
        options,
      }
    }

    !page && (page = o.getRootPage())

    const componentsList = u.array(components)
    const numComponents = componentsList.length

    for (let index = 0; index < numComponents; index++) {
      let componentObject = componentsList[index]
      // { components: ['.BaseHeader'] }
      if (u.isStr(componentObject) && nt.Identify.reference(componentObject)) {
        componentObject = i.defaultResolveReference(
          o.getRoot,
          page.page,
          componentObject,
        )
      }
      // { components: [{ '.BaseHeader': '', style:{ shadow:'true' } }] }
      if (u.isObj(componentObject) && !componentObject.type) {
        const keys = u.keys(componentObject)
        const refKey = keys.find((key) => nt.Identify.reference(key))
        if (refKey) {
          componentObject = i.defaultResolveReference(
            o.getRoot,
            page.page,
            refKey as any,
          )
        }
      }
      const { component: resolvedComponent, options } = await xform(
        o.createComponent(componentObject, page as NuiPage),
        { callback, context, on, page, ...otherOpts },
      )
      // if (on?.resolved) {
      //   const fn = on.resolved({
      //     components: componentsList,
      //     component: resolvedComponent,
      //     context,
      //     index,
      //     options,
      //     page,
      //   })
      //   if (u.isPromise(fn)) await fn
      // }
      resolvedComponents.push(resolvedComponent)
    }
    return (
      isArr ? resolvedComponents : resolvedComponents[0]
    ) as C extends any[] ? t.NuiComponent.Instance[] : t.NuiComponent.Instance
  }

  function _getActions(): ActionsCache
  function _getActions(
    actionType: 'emit',
  ): Map<t.NUITrigger, t.Store.ActionObject<'emit'>[]>
  function _getActions(
    actionType: 'builtIn',
  ): Map<string, t.Store.BuiltInObject[]>
  function _getActions<AType extends typeof groupedActionTypes[number]>(
    actionType: AType,
  ): t.Store.ActionObject<AType>[]
  function _getActions<GAType extends typeof groupedActionTypes[number]>(
    actionType?: GAType | 'builtIn' | 'emit' | never,
  ) {
    if (actionType === undefined) return cache.actions
    switch (actionType) {
      case 'builtIn':
        return cache.actions.builtIn
      case 'emit':
        return cache.actions.emit
      default:
        return cache.actions[actionType]
    }
  }

  /**
   * Handle register objects that have an "onEvent" by default for them
   * TODO - Enable them to have the option to disable or override this with their own function
   * TODO - Turn this into a transaction
   */

  function _experimental_Register(
    name: string,
    fn: t.Register.Object['fn'] | Partial<t.Register.Object>,
    options?: Partial<t.Register.Object>,
  ): t.Register.Object

  function _experimental_Register(
    registerComponent: nt.RegisterComponentObject,
    options?: Partial<t.Register.Object> | t.Register.Object['fn'],
  ): t.Register.Object

  function _experimental_Register(
    obj: nt.RegisterComponentObject | string,
    options: Partial<t.Register.Object> | t.Register.Object['fn'] = {},
    options2: Partial<t.Register.Object> = {},
  ) {
    try {
      let event = ''
      let register: t.Register.Object | undefined

      if (u.isStr(obj)) {
        event = obj
        register = (o.cache.register.get(event) || {}) as t.Register.Object
        if (u.isFnc(options)) {
          set(register, 'handler.fn', options)
          if (u.isObj(options2)) {
            if (options2.handler) {
              u.assign(register, options2)
              register.handler = { ...register.handler, ...options2.handler }
            } else {
              u.assign(register, options2)
            }
          }
        } else if (u.isObj(options)) {
          u.entries(options).forEach(([key, val]) => {
            if (register) {
              if (key === 'handler') {
                register.handler = { ...register.handler, ...options.handler }
                // @ts-expect-error
              } else register[key] = val
            }
          })
        }
        if (u.isFnc(register.handler?.fn) && u.isFnc(register.fn)) {
          register.fn = undefined
        }
        !register.page && (register.page = '_global')
        !register.callbacks && (register.callbacks = [])
        !(register.name === event) && (register.name = event)
      } else if (u.isObj(obj)) {
        event = obj.onEvent as string
        register = (o.cache.register.get(event) || {}) as t.Register.Object

        options && u.assign(register, options)

        !register.callbacks && (register.callbacks = [])
        register.name !== event && (register.name = event)
        !register.page && (register.page = '_global')

        if (!o.cache.register.has(event)) {
          if (register.handler) {
            if (u.isFnc(register.handler.fn) && u.isFnc(register.fn)) {
              // Setting register.fn to undefined because a custom handler fn
              // was provided (which takes higher priority)
              register.fn = undefined
            }
          } else {
            if (!u.isFnc(register.fn)) {
              register.fn = async function onRegisterFn(obj, params) {
                return Promise.all(
                  o.cache.register.get(event)?.callbacks?.map(async (cb) => {
                    if (isActionChain(cb)) {
                      // @ts-expect-error
                      return cb?.execute?.call(cb, obj, params)
                    }
                    return u.isFnc(cb) ? await cb(obj, params) : cb
                  }) || [],
                )
              }
            }
          }
          if (nt.Identify.folds.emit(obj)) {
            const ac = o.createActionChain(
              'register',
              { emit: obj.emit, actionType: 'emit' },
              { loadQueue: true },
            )
            // REMINDER - This should call hard coded observers registered from the web app
            register.callbacks.push(ac)
          }
        }
      }

      return cache.register.set(event, register as t.Register.Object)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      log.error(err)
    }
  }

  const _experimental = {
    get register() {
      return _experimental_Register
    },
  }

  const o = {
    _experimental,
    _defineGetter(
      key: string,
      opts: ((...args: any[]) => any) | PropertyDescriptor,
    ) {
      Object.defineProperty(this, key, {
        get: u.isFnc(opts) ? () => opts : () => opts.get,
      })
    },
    get cache() {
      return cache
    },
    get clean() {
      return _clean
    },
    get createGetter() {
      return _createGetter
    },
    get createGoto() {
      return _createGoto
    },
    get createComponent() {
      return _createComponent
    },
    createPage(
      args?:
        | string
        | NuiPage
        /**
         * If a component instance is given, we must set its page id to the
         * component id, emit the PAGE_CREATED component event and set the
         * "page" prop using the page instance
         */
        | t.NuiComponent.Instance
        | {
            name?: string
            component?: t.NuiComponent.Instance
            id?: string
            onChange?: { id?: string; fn: (prev: string, next: string) => void }
            viewport?: VP | { width?: number; height?: number }
          },
    ) {
      if (isNuiPage(args)) return args

      let name: string = ''
      let id: string | undefined = undefined
      let onChange:
        | { id?: string; fn?: (prev: string, next: string) => void }
        | undefined
      let page: NuiPage | undefined
      let viewport: VP | undefined

      if (u.isStr(args)) {
        name = args
      } else if (isComponent(args)) {
        id = args.id
        name = String(args.get('path') || '')
        page = args.get('page') || cache.page.get(args.id)?.page
        if (isNuiPage(page)) return page
      } else if (u.isObj(args)) {
        args.name && (name = args.name)
        args.onChange && (onChange = args.onChange)
        if (isComponent(args.component)) {
          const componentId = args.component.id
          if (componentId) {
            if (cache.page.has(componentId)) {
              return cache.page.get(componentId).page
            }
          }
        } else {
          id = args.id || id || ''
        }
        if (args?.viewport) {
          if (isViewport(args.viewport)) viewport = args.viewport
          else if (u.isObj(args.viewport)) viewport = new VP(args.viewport)
        }
      }

      page = cache.page.create({ id, name, onChange, viewport })
      ;(page as NuiPage)?.use(() => o.getRoot()[page?.page || '']?.components)

      return page as NuiPage
    },
    createPlugin(
      location:
        | t.Plugin.Location
        | t.Plugin.ComponentObject
        | t.NuiComponent.Instance = 'head',
      obj?: t.NuiComponent.Instance | t.Plugin.ComponentObject,
    ) {
      let _location = '' as t.Plugin.Location
      let _path = (isComponent(obj) ? obj.blueprint?.path : obj?.path) || ''

      if (u.isStr(location)) {
        _location = location
      } else {
        obj = location
        _path = location.blueprint?.path || ''
        const type = location?.type
        if (_path.endsWith('.css')) _location = 'head'
        else if (_path.endsWith('.html')) _location = 'body-top'
        // else if (type === 'plugin') _location = 'head'
        else if (type === 'pluginHead') _location = 'head'
        else if (type === 'pluginBodyTop') _location = 'body-top'
        else if (type === 'pluginBodyTail') _location = 'body-bottom'
        !_location && (_location = 'head')
      }

      const id = _path
      const plugin = {
        id,
        content: '',
        initiated: false,
        location: _location,
        path: _path,
      } as t.Plugin.Object

      if (!_path) {
        _path = ''
        plugin.id = ''
        plugin.path = ''
      }

      !cache.plugin.has(id) && cache.plugin.add(_location, plugin)
      return plugin
    },
    createActionChain(
      trigger: t.NUITrigger,
      actions: OrArray<t.NUIActionObjectInput>,
      opts?: ActionChainObserver & {
        component?: t.NuiComponent.Instance
        context?: Record<string, any>
        on?: t.ResolveComponentOptions<any, any>['on']
        loadQueue?: boolean
        id?: string
        page?: NuiPage
      },
      id?: string,
    ) {
      if (!u.isArr(actions)) actions = [actions]
      const _id = id || opts?.id || opts?.component?.id

      const actionChain = createActionChain({
        actions: u.reduce(
          actions,
          (acc: t.NUIActionObject[], obj) => {
            const errors = getActionObjectErrors(obj)
            if (errors.length && !isUnitTestEnv()) {
              errors.forEach((errMsg) =>
                log.error(`%c${errMsg}`, `color:#ec0000;`, obj),
              )
            }
            if (u.isObj(obj) && !('actionType' in obj)) {
              obj = { ...obj, actionType: getActionType(obj) }
            } else if (u.isFnc(obj)) {
              obj = { actionType: 'anonymous', fn: obj }
            }
            return acc.concat(obj as t.NUIActionObject)
          },
          [],
        ),
        trigger,
        loader: (objs) => {
          function __createExecutor(
            action: t.NUIAction,
            fns: (t.Store.ActionObject | t.Store.BuiltInObject)[] = [],
            options: t.ConsumerOptions,
          ) {
            return async function executeActionChain(event?: Event) {
              if (fns.length) {
                const results = [
                  ...(
                    await Promise.allSettled(
                      fns.map(
                        async (
                          obj: t.Store.ActionObject | t.Store.BuiltInObject,
                        ) => {
                          const result = await obj.fn?.(action as any, {
                            ...options,
                            component: opts?.component,
                            event,
                            ref: actionChain,
                          })
                          return result
                        },
                      ),
                    )
                  ).values(),
                ]
                return results.length < 2
                  ? results[0]?.['value']
                  : [...results?.values()]
              }
            }
          }

          return objs.map((obj) => {
            if (nt.Identify.folds.emit(obj)) {
              const action = createAction(trigger, obj)
              let listAttribute
              if (opts?.component) {
                listAttribute = getListAttribute(opts?.component)
              }
              if (opts?.component) {
                const iteratorVar =
                  opts?.context?.iteratorVar || findIteratorVar(opts.component)
                const dataObject =
                  opts?.context?.dataObject ||
                  findListDataObject(opts.component)
                if (obj.emit?.dataKey) {
                  action.dataKey = createEmitDataKey(
                    obj.emit.dataKey,
                    _getQueryObjects({
                      component: opts.component,
                      page: opts.page,
                      listDataObject: dataObject,
                    }),
                    { iteratorVar, listAttribute },
                  )
                }
              }

              const callbacks = o.cache.actions.emit?.get(trigger) || []

              action.executor = __createExecutor(
                action,
                callbacks,
                o.getConsumerOptions({
                  context: opts?.context,
                  component: opts?.component,
                  on: opts?.on,
                  page: opts?.page as NuiPage,
                }),
              )

              return action
            }

            const action = createAction(trigger, obj)

            action.executor = __createExecutor(
              action,
              nt.Identify.action.builtIn(obj)
                ? o.cache.actions.builtIn.get(obj.funcName as string)
                : nt.Identify.goto(obj)
                ? o.cache.actions.goto
                : o.cache.actions[obj.actionType] || [],
              o.getConsumerOptions({
                context: opts?.context,
                component: opts?.component,
                on: opts?.on,
                page: opts?.page as NuiPage,
              }),
            )

            return action
          })
        },
        // @ts-expect-error
        _id,
      })

      opts?.loadQueue && actionChain.loadQueue()
      opts?.on?.actionChain && actionChain.use(opts.on.actionChain)

      return actionChain
    },
    get createSrc() {
      return _createSrc
    },
    get emit() {
      return _emit
    },
    getAssetsUrl: () => '',
    getActions: _getActions,
    getBuiltIns: () => cache.actions.builtIn,
    getBaseUrl: () => '',
    getBaseStyles(
      component: t.NuiComponent.Instance | Record<string, any>,
      originalComponent:
        | t.NuiComponent.Instance
        | Record<string, any> = isComponent(component)
        ? component.blueprint
        : component,
    ) {
      const origStyle =
        (isComponent(component)
          ? component.blueprint?.style || component.style
          : originalComponent.style || component?.style) || {}
      const styles = { ...origStyle }

      if (VP.isNil(origStyle?.top) || origStyle?.top === 'auto') {
        styles.position = 'relative'
      } else {
        styles.position = 'absolute'
      }
      origStyle?.position == 'fixed' && (styles.position = 'fixed')

      u.isNil(origStyle.height) && (styles.height = 'auto')

      return merge(
        { ...o.getRoot()?.Style, position: 'absolute', outline: 'none' },
        origStyle,
        styles,
      )
    },
    getConsumerOptions({
      callback,
      component,
      on,
      page,
      context,
      ...rest
    }: {
      callback?(
        component: t.NuiComponent.Instance,
      ): t.NuiComponent.Instance | undefined
      component?: t.NuiComponent.Instance
      on?: t.ResolveComponentOptions<any>['on']
      page: NuiPage
      context?: Record<string, any>
    } & { [key: string]: any }) {
      const getPage = (page: NuiPage, component?: t.NuiComponent.Instance) => {
        if (component?.parent && nt.Identify.component.page(component.parent)) {
          if (isNuiPage(component.parent?.get?.('page'))) {
            return component.parent?.get?.('page')
          }
          if (cache.page.has(component.id)) {
            return cache.page.get(component.id).page
          }
        }
        return page || o.getRootPage()
      }

      return {
        ...o,
        ...rest,
        callback,
        cache,
        component,
        context, // Internal context during component resolving
        get createPage() {
          return o.createPage
        },
        createActionChain<C extends t.NuiComponent.CreateType, Context = any>(
          trigger: t.NUITrigger,
          actions: t.NUIActionObject | t.NUIActionObject[],
          {
            context: contextProp,
            loadQueue = true,
          }: { context?: Record<string, any>; loadQueue?: boolean } = {},
          id?: string,
        ) {
          const _id = u.isStr(id) && id ? id || component?.id : component?.id
          return o.createActionChain(
            trigger,
            actions,
            {
              context: { ...context, ...contextProp },
              component,
              loadQueue,
              id: _id,
              on,
              page,
            },
            _id,
          )
        },
        createSrc(
          key: string,
          value: string | nt.IfObject | nt.EmitObjectFold,
        ) {
          // @ts-expect-error
          return _createSrc({
            key,
            value,
            component,
            page: getPage(page, component),
          })
        },
        get emit() {
          return _emit
        },
        get getBaseStyles() {
          return rest.getBaseStyles || o.getBaseStyles
        },
        get getQueryObjects() {
          return _getQueryObjects
        },
        get on() {
          return on
        },
        get page() {
          return getPage(page, component)
        },
        get resolveComponents() {
          return _resolveComponents
        },
        get viewport() {
          return getPage(page, component)?.viewport
        },
      }
    },
    getPlugins(location?: t.Plugin.Location) {
      return cache.plugin.get(location)
    },
    getPages() {
      return [] as string[]
    },
    getPreloadPages() {
      return [] as string[]
    },
    getRoot() {
      return {} as Record<string, any>
    },
    getRootPage() {
      if (!cache.page.has('root')) {
        return cache.page.create({ viewport: new VP() })
      }
      return u.array(cache.page.get('root'))[0]?.page as NuiPage
    },
    get resolveComponents() {
      return _resolveComponents
    },
    reset() {
      cache.actions.clear()
      cache.actions.reset()
      cache.component.clear()
      cache.page.clear()
      cache.plugin.clear()
      cache.register.clear()
      cache.transactions.clear()
      o._defineGetter('getAssetsUrl', () => '')
      o._defineGetter('getBaseUrl', () => '')
      o._defineGetter('getPages', () => [])
      o._defineGetter('getPreloadPages', () => [])
      o._defineGetter('getRoot', () => '')
    },
    setLogLevel: (level: keyof typeof log.levels) => log.setLevel(level),
    use(args: t.UseArg) {
      for (const actionType of groupedActionTypes) {
        if (actionType in args) {
          u.forEach((fn) => {
            if (!u.isFnc(fn)) {
              throw new Error(
                `fn is required for handling actionType "${actionType}"`,
              )
            }
            cache.actions[actionType]?.push({ actionType, fn })
          }, u.array(args[actionType]))
        }
      }

      if ('builtIn' in args) {
        u.forEach(([funcName, fn]: [string, t.Store.BuiltInObject['fn']]) => {
          u.forEach((f) => {
            if (!funcName) {
              throw new Error(`Missing funcName in a builtIn handler`)
            }
            if (!cache.actions.builtIn.has(funcName)) {
              cache.actions.builtIn.set(funcName, [])
            }
            cache.actions.builtIn.get(funcName)?.push({
              actionType: 'builtIn',
              funcName,
              fn: f,
            })
          }, u.array(fn))
        }, u.entries(args.builtIn as Record<string, any>))
      }

      if ('emit' in args) {
        u.forEach(
          ([trigger, func]: [
            t.NUITrigger,
            t.Store.ActionObject<'emit'>['fn'],
          ]) =>
            u.forEach((fn) => {
              o.cache.actions.emit.get(trigger)?.push({
                actionType: 'emit',
                fn,
                trigger,
              })
            }, u.array(func)),
          // @ts-expect-error
          u.entries(args.emit),
        )
      }

      if (args.on) {
        for (const [key, value] of u.entries(args.on)) {
          if (!_hooks.has(key)) {
            _hooks.set(key, [])
          }

          if (key === 'actionChain') {
            //
          } else if (key === 'createComponent') {
            //
          } else if (key === 'if') {
            //
          } else if (key === 'emit') {
            //
          } else if (key === 'page') {
            //
          } else if (key === 'setup') {
            //
          }

          _hooks.get(key)?.push?.(value)
        }
      }

      if ('plugin' in args) {
        u.forEach(
          (plugin) => o.createPlugin(getPluginLocation(plugin), plugin),
          u.array(args.plugin),
        )
      }

      if ('register' in args) {
        if (
          nt.Identify.component.register(args.register) ||
          u.isArr(args.register)
        ) {
          u.forEach(unary(o._experimental.register), u.array(args.register))
        } else {
          // @ts-expect-error
          u.entries(args.register).forEach(
            ([event, fn]: [event: string, fn: t.Register.Object['fn']]) => {
              u.isFnc(fn) && o._experimental.register(event, fn)
            },
          )
        }
      }

      if ('transaction' in args) {
        // @ts-expect-error
        u.entries(args.transaction).forEach(([tid, fn]) => {
          const opts = {} as any
          u.isFnc(fn) ? (opts.fn = fn) : u.isObj(fn) && u.assign(opts, fn)
          cache.transactions.set(tid as t.TransactionId, opts)
        })
      }

      for (const key of [
        'getAssetsUrl',
        'getBaseUrl',
        'getPages',
        'getPreloadPages',
        'getRoot',
      ]) {
        args[key] && o._defineGetter(key, args[key])
      }

      return o
    },
  }

  function createRootFn(fn: (root: Record<string, any>) => any) {
    return function () {
      return fn(_getRoot())
    }
  }

  return o
})()

export default NUI

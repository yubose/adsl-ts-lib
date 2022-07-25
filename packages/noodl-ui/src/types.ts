import type { OrArray, OrPromise } from '@jsmanifest/typefest'
import type {
  ActionObject,
  ActionType,
  BuiltInActionObject,
  ComponentObject,
  ComponentType,
  EventType,
  EmitObjectFold,
  EvalActionObject,
  GotoObject,
  PageJumpActionObject,
  PageObject,
  PopupActionObject,
  PopupDismissActionObject,
  RefreshActionObject,
  RegisterComponentObject,
  SaveActionObject,
  StyleObject,
  ToastObject,
  UpdateActionObject,
  PluginComponentObject,
  PluginHeadComponentObject,
  PluginBodyTailComponentObject,
  PluginBodyTopComponentObject,
  ReferenceString,
  IfObject,
  PageComponentUrl,
  GetLocationAddressActionObject,
} from 'noodl-types'
import type {
  Action,
  ActionChain,
  ActionChainObserver,
} from 'noodl-action-chain'
import type { LiteralUnion } from 'type-fest'
import type ComponentBase from './Component'
import type _ComponentCache from './cache/ComponentCache'
import type _PluginCache from './cache/PluginCache'
import type EmitAction from './actions/EmitAction'
import type NUI from './noodl-ui'
import type NuiPage from './Page'
import type Viewport from './Viewport'
import {
  eventId,
  nuiEvent,
  groupedActionTypes,
  lib,
  nuiEmitType,
  nuiEmitTransaction,
  triggers,
} from './constants'
import type ComponentPage from './dom/factory/componentFactory/ComponentPage'
import type GlobalComponentRecord from './dom/global/GlobalComponentRecord'
import type GlobalTimers from './dom/global/Timers'
import type NDOM from './dom/noodl-ui-dom'
import type NDOMPage from './dom/Page'
import type NDOMResolver from './dom/Resolver'

export type NUIActionType = ActionType | typeof lib.actionTypes[number]
export type NUIActionGroupedType = typeof groupedActionTypes[number]
export type NuiComponentType = ComponentType | typeof lib.components[number]
export type NUITrigger = EventType | typeof lib.emitTriggers[number]
export type DataAttribute = typeof lib.dataAttributes[number]

/* -------------------------------------------------------
  ---- ACTIONS
-------------------------------------------------------- */

export type NUIActionChain = ActionChain<NUIActionObject, NUITrigger>

// Raw / non-ensured actionType
export type NUIActionObjectInput =
  | EmitObjectFold
  | GotoObject
  | NUIActionObject
  | ToastObject

export interface ComponentCacheObject {
  component: NuiComponent.Instance
  page: string
  pageId?: string
}

export namespace NUIEmit {
  export interface EmitRegister<Evt extends string = string> {
    type: typeof nuiEmitType.REGISTER
    event: Evt
    params?: Register.Params<any>
  }

  export interface EmitTransaction<K extends TransactionId = TransactionId> {
    type: typeof nuiEmitType.TRANSACTION
    transaction: K
    params?: Transaction[K]['params']
  }
}

// With ensured actionType appended
export type NUIActionObject =
  | AnonymousActionObject
  | BuiltInActionObject
  | EmitActionObject
  | EvalActionObject
  | GetLocationAddressActionObject
  | GotoActionObject
  | PageJumpActionObject
  | PopupActionObject
  | PopupDismissActionObject
  | RefreshActionObject
  | SaveActionObject
  | ToastActionObject
  | UpdateActionObject

export type NUIAction = Action | EmitAction

export interface AnonymousActionObject extends ActionObject {
  actionType: 'anonymous'
  fn?(...args: any[]): any
}

export interface EmitActionObject extends ActionObject, EmitObjectFold {
  actionType: 'emit'
  [key: string]: any
}

export interface GotoActionObject extends ActionObject, GotoObject {
  actionType: 'goto'
  [key: string]: any
}

export interface ToastActionObject extends ActionObject, ToastObject {
  actionType: 'toast'
  [key: string]: any
}

export interface GotoFn {
  (goto: GotoObject | string): any
}

export interface ICache {
  clear(): void
  length: number
}

export interface IPage {
  id: number | string | 'root'
  page: string
  viewport: Viewport
}

export type NormalizePropsContext = Record<string, any> & {
  dataObject?: Record<string, any>
  iteratorVar?: string
  index?: number
  listObject?: any[] | string
}

export namespace NuiComponent {
  export type CreateType = ComponentObject | NuiComponent.Instance

  export interface EditResolutionOptions {
    remove?: Record<string, () => boolean> | string[] | string
  }

  export type HookEvent = keyof Hook

  export type Hook = {
    [nuiEvent.component.list.ADD_DATA_OBJECT](args: {
      dataObject: any
      index: number
    }): void
    [nuiEvent.component.page.PAGE_CREATED](page: NuiPage): void
    [nuiEvent.component.page.PAGE_CHANGED](): void
    [nuiEvent.component.page.PAGE_COMPONENTS](options: {
      page: NuiPage
      type: 'init' | 'update'
    }): void
    content(pluginContent: string): void
    'data-value'(dataValue: any): void
    'data-src'(src: string): void
    image(src: string): void
    options(options: any[]): void
    path(src: string): void
    placeholder(src: string): void
  } & Partial<
    Record<
      TimerHook<'interval'>,
      (args: {
        value: Date | undefined
        component: NuiComponent.Instance
        node: HTMLElement
      }) => void
    > &
      Record<TimerHook<'init'>, (initialValue?: Date) => void> &
      Record<TimerHook<'ref'>, (ref: Timer) => void>
  >

  // TODO - Find a better place to put these Timer typings
  type TimerHook<Evt extends string = string> = `timer:${Evt}`
  export interface Timer {
    start(): void
    current: Date
    ref: NodeJS.Timeout | 0 | undefined
    clear: () => void
    increment(): void
    set(value: any): void
    onInterval?:
      | ((args: {
          value: Date | undefined
          node: HTMLElement
          component: NuiComponent.Instance
        }) => void)
      | null
  }

  export type Instance = ComponentBase

  export type Type = NuiComponentType
}

export namespace Plugin {
  export type ComponentObject =
    | PluginBodyTailComponentObject
    | PluginBodyTopComponentObject
    | PluginComponentObject
    | PluginHeadComponentObject

  export type Location = 'body-bottom' | 'body-top' | 'head'

  export interface Object {
    initiated?: boolean
    location?: Plugin.Location
    path?: string
    content?: string
    id?: string
  }
}

export type ConsumerOptions<Trig extends string = string> = Omit<
  ReturnType<typeof NUI.getConsumerOptions>,
  'createActionChain' | 'getBaseStyles'
> &
  Partial<ConsumerOptionsHelpers> &
  Pick<ResolveComponentOptions<any, any>, 'keepVpUnit'> & {
    createActionChain(
      trigger: LiteralUnion<NUITrigger | Trig, string>,
      actions: OrArray<NUIActionObject>,
      opts?: { loadQueue?: boolean },
    ): NUIActionChain
    event?: Event
    getBaseStyles(
      component: NuiComponent.Instance,
    ): StyleObject & { [key: string]: any }
    ref?: NUIActionChain
  }

export interface ConsumerOptionsHelpers {
  resolveReference: (keyOrValue: any, value?: any) => any
}

export interface On {
  actionChain?: ActionChainObserver
  page?(page: NuiPage): OrPromise<void>
  setup?(component: NuiComponent.Instance): OrPromise<void>
  /**
   * Called whenever a NuiComponent instance is created (depth-first)
   * @param component NuiComponent
   * @param args Context
   */
  createComponent?(
    component: NuiComponent.Instance,
    args: {
      path?: (number | string)[]
      page?: NuiPage
      parent: NuiComponent.Instance | null
      index?: number
      iteratorVar?: number
      dataObject?: number
    },
  ): OrPromise<void>
  if?(args: {
    component?: NuiComponent.Instance
    page?: NuiPage
    key: string
    value: IfObject
  }): boolean | null | undefined
  emit?: {
    createActionChain?(opts: {
      actionChain: NUIActionChain
      actions: NUIActionObject
      component: NuiComponent.Instance
      shouldExecuteImmediately?:
        | boolean
        | ((actionChain: NUIActionChain) => boolean)
      trigger: NUITrigger
    }): Promise<void> | void
  }
  pageComponentUrl?(args: {
    component?: NuiComponent.Instance
    page?: NuiPage
    key: string
    value: PageComponentUrl
  }): string
}

export namespace Register {
  export interface Object<N extends string = string> {
    name: N
    callbacks: (NUIActionChain | Register.Object['fn'])[]
    page: LiteralUnion<Register.Page | '_global', string>
    params?: Register.ParamsObject
    handler?: {
      fn?: Register.Object['fn']
      useReturnValue?: boolean
    }
    fn?: (
      obj: Register.Object,
      params: Register.Params | undefined,
    ) => Promise<any>
  }

  export type Params<RT = any> =
    | ParamsObject
    | ((obj: Register.Object) => Promise<RT> | RT)

  export type ParamsObject<K extends string = string> = Record<
    LiteralUnion<K, string>,
    any
  > & {
    args?: any[]
    data?: K | Record<K, any>
  }

  export type Page<P extends string = '_global'> = LiteralUnion<P, string>
}

export interface ResolveComponentOptions<
  C extends OrArray<NuiComponent.CreateType>,
  Context extends Record<string, any> = Record<string, any>,
> {
  callback?(component: NuiComponent.Instance): NuiComponent.Instance | undefined
  components: C
  context?: Context
  keepVpUnit?: boolean
  on?: On
  page?: NuiPage
}

export namespace Store {
  export interface ActionObject<
    AType extends NUIActionType = NUIActionType,
    ATrigger extends string = string,
  > {
    actionType: AType
    fn(
      action: AType extends 'emit' ? EmitAction : Action<AType, ATrigger>,
      options: ConsumerOptions,
    ): Promise<any[] | void>
    trigger?: LiteralUnion<ATrigger | NUITrigger, string>
  }

  export interface BuiltInObject<
    FuncName extends string = string,
    ATrigger extends string = string,
  > {
    actionType: 'builtIn'
    fn(action: Action<'builtIn', ATrigger>, options: any): Promise<any[] | void>
    funcName: FuncName
  }
}

export interface SelectOption {
  key: string
  label: string
  value: string
}

export interface Transaction {
  [nuiEmitTransaction.REQUEST_PAGE_OBJECT]: {
    params: { page: string; modifiers?: Record<string, any> }
    fn(page: NuiPage | NuiPage['page']): Promise<PageObject>
    callback(pageObject: PageObject): void
  }
  [key: string]: any
}

export type TransactionId = LiteralUnion<keyof Transaction, string>

export interface UseArg<
  TObj extends Record<string, any> = Record<string, any>,
  TName extends TransactionId = TransactionId,
> extends Partial<
    Record<NUIActionGroupedType, OrArray<Store.ActionObject['fn']>>
  > {
  builtIn?: Record<string, OrArray<Store.BuiltInObject['fn']>>
  emit?: Partial<
    Record<
      NUITrigger,
      Store.ActionObject<'emit'>['fn'] | Store.ActionObject<'emit'>['fn'][]
    >
  >
  getAssetsUrl?: () => string
  getBaseUrl?: () => string
  getPages?: () => string[]
  getPreloadPages?: () => string[]
  getRoot?: () => Record<string, any>
  on?: On
  plugin?: OrArray<ComponentObject>
  register?:
    | OrArray<
        RegisterComponentObject & { handler?: Register.Object['handler'] }
      >
    | Record<string, Register.Object['fn']>
  transaction?: Partial<
    Record<LiteralUnion<TName, string>, TObj[TName] | TObj[TName]['fn']>
  >
}

/* -------------------------------------------------------
  ---- DOM
-------------------------------------------------------- */

export interface IGlobalObject<T extends string = string> {
  type: T
}

export interface GlobalMap {
  components: Map<string, GlobalComponentRecord>
  hooks: Map<string, Record<string, ((...args: any[]) => any)[]>>
  mapping: Map<
    string,
    {
      componentId: string
      pageId: string
      children: { componentId: string; pageId: string }[]
    }[]
  >
  pages: Record<string, ComponentPage | NDOMPage>
  timers: GlobalTimers
}

export interface Hooks {
  onRedrawStart(args: {
    parent: NuiComponent.Instance | null
    component: NuiComponent.Instance
    context?: { dataObject?: any }
    node: HTMLElement | null
    page: NDOMPage
  }): OrPromise<void>
  onBeforeRequestPageObject(page: NDOMPage): void
  onAfterRequestPageObject(page: NDOMPage): void
}

export type DOMNodeInput =
  | HTMLCollection
  | HTMLElement
  | HTMLElement[]
  | NodeList
  | NodeListOf<any>
  | null

export type NDOMElement<T extends string = string> = T extends 'button'
  ? HTMLButtonElement
  : T extends 'canvas'
  ? HTMLCanvasElement
  : T extends 'chart'
  ? HTMLDivElement
  : T extends 'chatList'
  ? HTMLUListElement
  : T extends 'divider'
  ? HTMLHRElement
  : T extends 'ecosDoc'
  ? HTMLDivElement
  : T extends 'footer'
  ? HTMLDivElement
  : T extends 'header'
  ? HTMLDivElement
  : T extends 'label'
  ? HTMLDivElement
  : T extends 'map'
  ? HTMLDivElement
  : T extends 'iframe' | 'page'
  ? HTMLIFrameElement
  : T extends 'plugin' | 'pluginBodyTail' | 'pluginBodyTop' | 'pluginHead'
  ? HTMLDivElement | HTMLLinkElement | HTMLScriptElement | HTMLStyleElement
  : T extends 'popUp'
  ? HTMLDivElement
  : T extends 'image'
  ? HTMLImageElement
  : T extends 'textField'
  ? HTMLInputElement
  : T extends 'list'
  ? HTMLUListElement
  : T extends 'listItem'
  ? HTMLLIElement
  : T extends 'register'
  ? HTMLElement
  : T extends 'stylesheet'
  ? HTMLLinkElement
  : T extends 'script'
  ? HTMLScriptElement
  : T extends 'select'
  ? HTMLSelectElement
  : T extends 'style'
  ? HTMLStyleElement
  : T extends 'textView'
  ? HTMLTextAreaElement
  : T extends 'video'
  ? HTMLVideoElement
  : T extends 'view'
  ? HTMLDivElement
  : HTMLElement

export type ElementBinding = Map<
  'audioStream' | 'videoStream',
  (component: NuiComponent.Instance) => HTMLElement | null
>

export namespace Resolve {
  export interface BaseOptions<
    T extends string = string,
    N extends NDOMElement<T> = NDOMElement<T>,
  > {
    node: N
    component: NuiComponent.Instance
    page?: NDOMPage
  }

  export interface Config<
    T extends string = string,
    N extends NDOMElement<T> = NDOMElement<T>,
  > {
    name?: string
    cond?: LiteralUnion<ComponentType, string> | Resolve.Func<T, N, boolean>
    init?: Resolve.Func<T, N>
    before?: Resolve.Func<T, N>
    resolve?: Resolve.Func<T, N>
    after?: Resolve.Func<T, N>
  }

  export interface Func<
    T extends string = string,
    N extends NDOMElement<T> = NDOMElement<T>,
    RT = void,
  > {
    (
      options: Resolve.BaseOptions<T, N> &
        ReturnType<NDOMResolver['getOptions']>,
    ): RT
  }

  export interface LifeCycle {
    before: Resolve.Config[]
    resolve: Resolve.Config[]
    after: Resolve.Config[]
  }

  export type LifeCycleEvent = 'after' | 'before' | 'resolve'
}

export namespace Render {
  export interface Func {
    (components: ComponentObject | ComponentObject[]): NuiComponent.Instance[]
  }
}

export type RegisterOptions = Resolve.Config

export namespace Page {
  export type HookEvent = keyof Hook

  export type Hook = {
    [eventId.page.on.ON_ASPECT_RATIO_MIN](prevMin: number, min: number): void
    [eventId.page.on.ON_ASPECT_RATIO_MAX](prevMax: number, max: number): void
    [eventId.page.on.ON_STATUS_CHANGE](status: Page.Status): void
    [eventId.page.on.ON_NAVIGATE_START](page: NDOMPage): void
    [eventId.page.on.ON_NAVIGATE_STALE](args: {
      previouslyRequesting: string
      newPageRequesting: string
      snapshot: Snapshot
    }): void
    [eventId.page.on.ON_NAVIGATE_ERROR](
      snapshot: Snapshot & { error: Error },
    ): void
    [eventId.page.on.ON_BEFORE_CLEAR_ROOT_NODE](node: HTMLElement): void
    [eventId.page.on.ON_DOM_CLEANUP](args: {
      global: NDOM['global']
      node: NDOM['page']['node']
    }): void
    [eventId.page.on.ON_BEFORE_RENDER_COMPONENTS](
      snapshot: Snapshot & { components: NuiComponent.Instance[] },
    ): void
    [eventId.page.on.ON_COMPONENTS_RENDERED](page: NDOMPage): void
    [eventId.page.on.ON_APPEND_NODE](args: {
      page: NDOMPage
      parentNode: HTMLElement
      node: HTMLElement
      component: NuiComponent.Instance
    }): void
    // Redraw events
    [eventId.page.on.ON_REDRAW_BEFORE_CLEANUP](args: {
      parent: NuiComponent.Instance | null
      component: NuiComponent.Instance
      context?: { dataObject?: any }
      node: HTMLElement | null
      page: NDOMPage
    }): void
    [eventId.page.on.ON_SET_ROOT_NODE](args: {
      node: HTMLDivElement | HTMLIFrameElement | null
    }): void
  }

  export interface HookDescriptor<Evt extends Page.HookEvent = Page.HookEvent> {
    id: Evt
    once?: boolean
    fn: Page.Hook[Evt]
  }

  export interface State {
    aspectRatio: number
    aspectRatioMin: number
    aspectRatioMax: number
    previous: string
    requesting: string
    modifiers: {
      [pageName: string]: {
        [key: string]: any
      } & { reload?: boolean }
    }
    status: Status
    node: boolean
  }

  export type Status =
    typeof eventId.page.status[keyof typeof eventId.page.status]

  export type Snapshot = ReturnType<NDOMPage['snapshot']>
}

export interface NDOMTransaction {
  REQUEST_PAGE_OBJECT(page: NDOMPage): Promise<NDOMPage>
}

export type NDOMTransactionId = keyof NDOMTransaction

export type NDOMTrigger = typeof triggers[number]

export interface ViewportObject {
  width: number
  height: number
}

export interface UseObject {
  builtIn?: any
  createElementBinding?(
    component: NuiComponent.Instance,
  ): HTMLElement | null | void
  emit: Partial<
    Record<NDOMTrigger, OrArray<Store.ActionObject<'emit', NDOMTrigger>['fn']>>
  >
  plugin?: any
  resolver?: Resolve.Config
  transaction?: Partial<NDOMTransaction>
}

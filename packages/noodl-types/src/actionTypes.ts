import type { LiteralUnion } from 'type-fest'
import type { OrArray } from './_internal/types'
import type {
  EmitObject,
  EmitObjectFold,
  GotoObject,
  IfObject,
} from './uncategorizedTypes'
import type { BuiltInEvalObject, DataIn, ReferenceString } from './ecosTypes'

export interface UncommonActionObjectProps {
  actions?: any[]
  contentType?: string // ex: "messageHidden"
  emit?: EmitObject
  /**
   * The path to a data object or value. It might provide a different behavior depending on where it is placed. For example, a dataKey set on a textField component will bind its value to the path in the dataKey, enabling it to mutate the value while updating textField's value
   *
   * @example
   * ```
   * const dataKey1 = "formData.password"
   * const dataKey2 = "SignIn.formData.password"
   * ```
   */
  dataKey?: string | EmitObjectFold | IfObject
  dataIn?: any
  /**
   * An object that contains data.
   * It is most commonly used in actions such as updateObject as a way to update its data values
   */
  dataObject?: any
  destination?: string
  /**
   * Signals that a popup should close when a user clicks outside of it. This is used for closing modals/popups
   */
  dismissOnTouchOutside?: boolean
  evolve?: boolean
  /**
   * A name/identifier for a function. This is used mainly for builtIn actions, where applications implement their own behavior and binds it to some object in the noodl
   *
   * @example
   *
   * ```
   * const action1 = { actionType: 'builtIn', funcName: 'redraw' }
   * const action2 = { actionType: 'builtIn', funcName: 'saveSignature' }
   * ```
   */
  funcName?: string
  message?: string
  object?: any
  pageReload?: boolean
  /**
   * A binding between a popUp or popUpDismiss component to a popUp action
   */
  popUpView?: string
  /**
   * When set to true, this signals that a page should run its \"init\" operation upon visiting from the user. If it is false, a page will not run it, which can be used to  persist values when navigating pages
   */
  reload?: boolean
  /**
   * A timer is useful for situations such as chat rooms where users will have a time limit before being getting out
   */
  timer?: number
  /**
   * An identifier which is used to bind a component and an action together. Actions can define a viewTag that invokes certain behavior towards a component. The component must also contain the same viewTag key/value. If multiple components have the same viewTag, then the action will effect multiple components
   * @example
   * ```json
   * {
   *   "actionType": "builtIn",
   *   "funcName": "redraw",
   *   "viewTag": "mainView"
   * }
   * ```
   */
  viewTag?: string
  /**
   * Used to prevent further actions from happening. For example, a popUp action with \"wait: true\" will open a pop up in the page and will not run actions that are next in the call stack. This can be used to restrict access to pages when authenticating
   *
   * @example
   *
   * ```
   * const action1 = { actionType: 'popUp', wait: true }
   * const action2 = { actionType: 'popUp', wait: 5000 }
   * ```
   */
  wait?: boolean | number
}

export interface ActionObject<T extends string = string> {
  /**
   * An identifier/name for an action
   *
   * @example
   *
   * ```
   * const examples = ['openCamera','openPhotoLibrary','openDocumentManager','pageJump','popUpDismiss','refresh','register','removeSignature','saveObject','saveSignature','updateObject','popUp','builtIn','evalObject']
   * ```
   */
  actionType: T
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "builtIn",
 *   "funcName": "redraw",
 *   "viewTag": "mainView"
 * }
 * ```
 */
export interface BuiltInActionObject
  extends ActionObject,
    Pick<
      UncommonActionObjectProps,
      'contentType' | 'dataKey' | 'evolve' | 'funcName' | 'reload' | 'viewTag'
    > {
  actionType: 'builtIn'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "evalObject",
 *   "object": [
 *     {
 *       "=.builtIn.object.set": {
 *         "object": "..formData.userProfile",
 *         "key": "username",
 *         "value": ".SignIn.tempUser.username"
 *       }
 *     }
 *   ]
 * }
 * ```
 */
export interface EvalActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataKey' | 'dataObject'> {
  actionType: 'evalObject'
  object?: OrArray<
    | IfObject
    | BuiltInEvalObject
    | BuiltInActionObject
    | GotoObject<string | { dataIn?: DataIn }>
    | ''
    | Record<
        ReferenceString,
        | null
        | boolean
        | BuiltInEvalObject
        | LiteralUnion<ReferenceString, string>
        | number
        | string
        | Record<ReferenceString, ReferenceString>
      >
  >
  [key: string]: any
}

export interface OpenCameraActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataKey' | 'dataObject'> {
  actionType: 'openCamera'
  [key: string]: any
}

export interface OpenPhotoLibraryActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataKey' | 'dataObject'> {
  actionType: 'openPhotoLibrary'
  [key: string]: any
}

export interface OpenDocumentManagerActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataKey' | 'dataObject'> {
  actionType: 'openDocumentManager'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "pageJump",
 *   "destination": "MeetingRoomInvited"
 * }
 * ```
 */
export interface PageJumpActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'destination'> {
  actionType: 'pageJump'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "popUp",
 *   "popUpView": "mainView"
 * }
 * ```
 */
export interface PopupActionObject
  extends ActionObject,
    Pick<
      UncommonActionObjectProps,
      'dismissOnTouchOutside' | 'popUpView' | 'wait'
    > {
  actionType: 'popUp'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "popUpDismiss",
 *   "popUpView": "mainView"
 * }
 * ```
 */
export interface PopupDismissActionObject
  extends ActionObject,
    Pick<
      UncommonActionObjectProps,
      'dismissOnTouchOutside' | 'popUpView' | 'wait'
    > {
  actionType: 'popUpDismiss'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "refresh"
 * }
 * ```
 */
export interface RefreshActionObject extends ActionObject {
  actionType: 'refresh'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "removeSignature",
 *   "dataObject": "BLOB",
 *   "dataKey": "SignIn.tempUser.signature"
 * }
 * ```
 */
export interface RemoveSignatureActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataObject' | 'dataKey'> {
  actionType: 'removeSignature'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "saveAction",
 *   "object": "..abc.profile"
 * }
 * ```
 */
export interface SaveActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'object'> {
  actionType: 'saveObject'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "saveSignature",
 *   "dataObject": "BLOB",
 *   "dataKey": "SignIn.tempUser.signature"
 * }
 * ```
 */
export interface SaveSignatureActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataObject' | 'dataKey'> {
  actionType: 'saveSignature'
  [key: string]: any
}

export interface GetLocationAddressActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataKey'> {
  actionType: 'getLocationAddress'
  [key: string]: any
}

/**
 * @example
 * ```json
 * {
 *   "actionType": "updateObject",
 *   "dataObject": "BLOB",
 *   "dataKey": "SignIn.tempUser.profile"
 * }
 * ```
 */
export interface UpdateActionObject
  extends ActionObject,
    Pick<UncommonActionObjectProps, 'dataObject' | 'dataKey'> {}

import * as u from '@jsmanifest/utils'
import type { NoodlObject } from 'noodl-builder'
import type { PartialDeep } from 'type-fest'
import type {
  BuiltInActionObject,
  EcosDocument,
  EmitObjectFold,
  EvalActionObject,
  GotoObject,
  IfObject,
  NameField,
  PageJumpActionObject,
  PopupActionObject,
  PopupDismissActionObject,
  RefreshActionObject,
  RemoveSignatureActionObject,
  SaveActionObject,
  SaveSignatureActionObject,
  UpdateActionObject,
} from 'noodl-types'
import {
  mergeObject,
  mergeKeyValOrObj,
  strOrUndef,
  strOrEmptyStr,
} from '../utils'
import builder from '../builder'
import ecosJpgDoc from '../fixtures/jpg.json'
import ecosNoteDoc from '../fixtures/note.json'
import ecosPdfDoc from '../fixtures/pdf.json'
import ecosPngDoc from '../fixtures/png.json'
import ecosTextDoc from '../fixtures/text.json'
import * as t from '../types'

const actionFactory = (function () {
  function builtIn<FuncName extends string>(
    funcName: FuncName,
  ): BuiltInActionObject & { funcName: FuncName }

  function builtIn(props?: Partial<BuiltInActionObject>): BuiltInActionObject

  function builtIn(): BuiltInActionObject

  function builtIn(obj?: string | Partial<BuiltInActionObject>) {
    const a = builder.action('builtIn')
    const funcName = a.createProperty('funcName', '')
    if (u.isStr(obj)) funcName.setValue(obj)
    return mergeObject(a, u.isObj(obj) ? obj : undefined).build()
  }

  function evalObject(
    obj?: any[] | EvalActionObject['object'] | Partial<EvalActionObject>,
  ) {
    const a = builder.action('evalObject')
    a.createProperty('object', undefined)
    if (u.isArr(obj)) a.setValue('object', obj)
    else if (u.isObj(obj)) mergeObject(a, obj)
    return a.build() as EvalActionObject
  }

  function pageJump(props?: Partial<PageJumpActionObject>) {
    return mergeObject<PageJumpActionObject>(builder.action('pageJump'), {
      destination: 'SignIn',
      ...props,
    }).build()
  }

  function popUp<PopUpView extends string>(
    popUpView: PopUpView,
  ): PopupActionObject & { popUpView: PopUpView }

  function popUp(props?: Partial<PopupActionObject>): PopupActionObject

  function popUp(): PopupActionObject

  function popUp(props?: string | Partial<PopupActionObject>) {
    const a = builder.action('popUp')
    a.createProperty('popUpView', strOrEmptyStr(props))
    return mergeObject(a, u.isObj(props) ? props : undefined).build()
  }

  function popUpDismiss<PopUpView extends string>(
    popUpView: PopUpView,
  ): PopupDismissActionObject & { popUpView: PopUpView }

  function popUpDismiss(
    props?: Partial<PopupDismissActionObject>,
  ): PopupDismissActionObject

  function popUpDismiss(): PopupDismissActionObject

  function popUpDismiss(props?: string | Partial<PopupDismissActionObject>) {
    const a = builder.action('popUpDismiss')
    a.createProperty('popUpView', strOrEmptyStr(props))
    return mergeObject(a, u.isObj(props) ? props : undefined).build()
  }

  function refresh<A extends RefreshActionObject>(props?: Partial<A>) {
    return mergeObject(builder.action('refresh'), props).build()
  }

  function removeSignature<A extends RemoveSignatureActionObject>(
    props?: Partial<A>,
  ) {
    return mergeObject(builder.action('removeSignature'), {
      dataKey: '',
      dataObject: '',
      ...props,
    }).build()
  }

  function saveSignature<A extends SaveSignatureActionObject>(
    props?: Partial<A>,
  ) {
    return mergeObject(builder.action('saveSignature'), {
      dataKey: '',
      dataObject: '',
      ...props,
    }).build()
  }

  function saveObject<A extends SaveActionObject>(props?: Partial<A>) {
    return mergeObject(builder.action('saveObject'), props).build()
  }

  function updateObject<A extends UpdateActionObject>(props?: A) {
    return mergeObject(builder.action('updateObject'), props).build()
  }

  /**
   * Generate an eCOS document object by component props
   */
  function ecosDoc<N extends NameField>(
    propsProp?: PartialDeep<EcosDocument<N>>,
  ): EcosDocument<N>
  /**
   * Generate an eCOS document object by preset
   */
  function ecosDoc<N extends NameField>(
    preset?: t.GetEcosDocObjectPreset,
  ): EcosDocument<N>
  /**
   * Generate an eCOS document object
   * @param propsProp - eCOS document preset or component props
   * @returns { EcosDocument }
   */
  function ecosDoc<N extends NameField>(
    propsProp?: t.GetEcosDocObjectPreset | PartialDeep<EcosDocument<N>>,
  ): EcosDocument<N> {
    let ecosObj = {
      name: { data: `blob:http://a0242fasa141inmfakmf24242`, type: '' as any },
    } as Partial<EcosDocument<NameField>>

    if (u.isStr(propsProp)) {
      if (propsProp === 'audio') {
        ecosObj.name = { ...ecosObj.name, type: 'audio/wav' }
        ecosObj.subtype = { ...ecosObj.subtype, mediaType: 2 }
      } else if (propsProp === 'docx') {
        ecosObj.name = { ...ecosObj.name, type: 'application/vnl.' as any }
        ecosObj.subtype = { ...ecosObj.subtype, mediaType: 1 }
      } else if (propsProp === 'image') {
        ecosObj = (ecosPngDoc || ecosJpgDoc) as EcosDocument
      } else if (propsProp === 'message') {
        ecosObj.subtype = { ...ecosObj.subtype, mediaType: 5 }
      } else if (propsProp === 'note') {
        ecosObj = ecosNoteDoc as EcosDocument
      } else if (propsProp === 'pdf') {
        ecosObj = ecosPdfDoc as EcosDocument
      } else if (propsProp === 'text') {
        ecosObj = ecosTextDoc as EcosDocument
      } else if (propsProp === 'video') {
        ecosObj.name = { ...ecosObj.name, type: 'video/mp4' }
        ecosObj.subtype = { ...ecosObj.subtype, mediaType: 9 }
      }
    } else if (u.isObj(propsProp)) {
      u.assign(ecosObj, propsProp)
    } else {
      ecosObj = ecosTextDoc as EcosDocument
    }

    return ecosObj as EcosDocument<N>
  }

  function emitObject<DataKey = any, Actions = any>(
    dataKey: DataKey,
    actions?: Actions,
  ): EmitObjectFold

  function emitObject(props?: Partial<EmitObjectFold>): EmitObjectFold

  function emitObject(): EmitObjectFold

  function emitObject<DataKey = any, Actions = any>(
    arg1?: DataKey | Partial<EmitObjectFold>,
    arg2?: Actions,
  ) {
    const emit = builder.object()
    const prop = emit.createProperty('emit')
    prop.setValue({ dataKey: '', actions: [] })
    const emitObject = prop.getValue() as NoodlObject
    if (arg1) {
      if ((u.isObj(arg1) && 'dataKey' in arg1) || 'actions' in arg1) {
        mergeObject(emitObject, arg1)
      } else {
        emitObject.setValue('dataKey', arg1)
      }
    }
    if (u.isArr(arg2)) emitObject.setValue('actions', arg2)
    return emit.build()
  }

  function goto<Destination extends string>(
    goto: Destination,
  ): GotoObject & { goto: Destination }

  function goto(props?: Partial<GotoObject>): GotoObject

  function goto(): GotoObject

  function goto<A extends GotoObject>(props?: string | Partial<A>) {
    return mergeKeyValOrObj(
      builder.action('goto'),
      'goto',
      strOrEmptyStr(props),
      props,
    ).build()
  }

  function ifObject<IfConditions extends any[]>(
    ifConditions: IfConditions,
  ): IfObject & { if: IfConditions }

  function ifObject(props?: Partial<IfObject>): IfObject

  function ifObject(): IfObject

  function ifObject<IfConditions extends any[]>(
    value?: IfObject | IfConditions,
  ) {
    const a = builder.object()
    if (u.isArr(value)) a.createProperty('if', value)
    else a.createProperty('if', value?.if || [])
    return a.build()
  }

  return {
    builtIn,
    ecosDoc,
    evalObject,
    emit: emitObject,
    goto,
    ifObject,
    pageJump,
    popUp,
    popUpDismiss,
    refresh,
    removeSignature,
    saveObject,
    saveSignature,
    updateObject,
  }
})()

export default actionFactory

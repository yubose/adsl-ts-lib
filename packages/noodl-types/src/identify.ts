import type { ComponentType } from './constantTypes'
import { componentTypes } from './_internal/constants'
import isAwaitReference from './utils/isAwaitReference'
import isEvalReference from './utils/isEvalReference'
import isEvalLocalReference from './utils/isEvalLocalReference'
import isEvalRootReference from './utils/isEvalRootReference'
import isLocalReference from './utils/isLocalReference'
import isRootReference from './utils/isRootReference'
import isTildeReference from './utils/isTildeReference'
import isTraverseReference from './utils/isTraverseReference'
import * as t from './index'
import * as i from './_internal/index'

type PlainObject<O extends Record<string, any> = Record<string, any>> = Record<
  string,
  any
> &
  O

function createIdentifier<
  O = any,
  IdentifyFn extends (v: unknown) => v is O = (v: unknown) => v is O,
>(pred: IdentifyFn) {
  return function <V = any>(fn: (v: any) => boolean) {
    return function (v: any): v is V {
      // @ts-expect-error
      return pred(v) ? fn(v) : undefined
    }
  }
}

const identifyArr = createIdentifier<any[]>(i.isArr)
const identifyNum = createIdentifier<number>(i.isNum)
const identifyObj = createIdentifier<PlainObject>(i.isObj)
const identifyStr = createIdentifier<string>(i.isStr)

export const Identify = (function () {
  const composeSomes =
    (...fns: any[]) =>
    (arg: any) =>
      fns.some((fn) => fn(arg))

  const o = {
    rootConfig: identifyObj<t.RootConfig>((v) =>
      ['apiHost', 'apiPort'].every((key) => key in v),
    ),
    appConfig: identifyObj<t.AppConfig>((v) =>
      ['startPage'].every((key) => key in v),
    ),
    action: {
      any: identifyObj<t.ActionObject>((v) => 'actionType' in v),
      builtIn: identifyObj<t.BuiltInActionObject>(
        (v) => 'funcName' in v || v.actionType === 'builtIn',
      ),
      evalObject: identifyObj<t.EvalActionObject>(
        (v) => v.actionType === 'evalObject',
      ),
      getLocationAddress: identifyObj<t.GetLocationAddressActionObject>(
        (v) => v.actionType === 'getLocationAddress',
      ),
      openCamera: identifyObj<t.OpenCameraActionObject>(
        (v) => v.actionType === 'openCamera',
      ),
      openPhotoLibrary: identifyObj<t.OpenPhotoLibraryActionObject>(
        (v) => v.actionType === 'openPhotoLibrary',
      ),
      openDocumentManager: identifyObj<t.OpenDocumentManagerActionObject>(
        (v) => v.actionType === 'openDocumentManager',
      ),
      pageJump: identifyObj<t.PageJumpActionObject>(
        (v) => v.actionType === 'pageJump',
      ),
      popUp: identifyObj<t.PopupActionObject>((v) => v.actionType === 'popUp'),
      popUpDismiss: identifyObj<t.PopupDismissActionObject>(
        (v) => v.actionType === 'popUpDismiss',
      ),
      refresh: identifyObj<t.RefreshActionObject>(
        (v) => v.actionType === 'refresh',
      ),
      removeSignature: identifyObj<t.RemoveSignatureActionObject>(
        (v) => v.actionType === 'removeSignature',
      ),
      saveObject: identifyObj<t.SaveActionObject>(
        (v) => v.actionType === 'saveObject',
      ),
      saveSignature: identifyObj<t.SaveSignatureActionObject>(
        (v) => v.actionType === 'saveSignature',
      ),
      updateObject: identifyObj<t.UpdateActionObject>(
        (v) => v.actionType === 'updateObject',
      ),
    },
    actionChain(v: unknown) {
      return (
        i.isArr(v) && [o.action.any, o.emit, o.goto].some((fn) => v.some(fn))
      )
    },
    /**
     * Returns true if the value is a NOODL boolean. A value is a NOODL boolean
     * if the value is truthy, true, "true", false, or "false"
     * @param { any } value
     */
    isBoolean(value: unknown) {
      return o.isBooleanTrue(value) || o.isBooleanFalse(value)
    },
    isBooleanTrue(value: unknown): value is true | 'true' {
      return value === true || value === 'true'
    },
    isBooleanFalse(value: unknown): value is false | 'false' {
      return value === false || value === 'false'
    },
    component: {
      button: identifyObj<t.ButtonComponentObject>((v) => v.type === 'button'),
      canvas: identifyObj<t.CanvasComponentObject>((v) => v.type === 'canvas'),
      divider: identifyObj<t.DividerComponentObject>(
        (v) => v.type === 'divider',
      ),
      ecosDoc: identifyObj<t.EcosDocComponentObject>(
        (v) => v.type === 'ecosDoc',
      ),
      footer: identifyObj<t.FooterComponentObject>((v) => v.type === 'footer'),
      header: identifyObj<t.HeaderComponentObject>((v) => v.type === 'header'),
      image: identifyObj<t.ImageComponentObject>((v) => v.type === 'image'),
      label: identifyObj<t.LabelComponentObject>((v) => v.type === 'label'),
      list: identifyObj<t.ListComponentObject>((v) => v.type === 'list'),
      listLike: identifyObj<t.ListComponentObject | t.ChatListComponentObject>(
        (v) => ['chatList', 'list'].includes(v.type),
      ),
      listItem: identifyObj<t.ListItemComponentObject>(
        (v) => v.type === 'listItem',
      ),
      map: identifyObj<t.MapComponentObject>((v) => v.type === 'map'),
      page: identifyObj<t.PageComponentObject>((v) => v.type === 'page'),
      plugin: identifyObj<t.PluginComponentObject>((v) => v.type === 'plugin'),
      pluginHead: identifyObj<t.PluginHeadComponentObject>(
        (v) => v.type === 'pluginHead',
      ),
      pluginBodyTop: identifyObj<t.PluginBodyTopComponentObject>(
        (v) => v.type === 'pluginBodyTop',
      ),
      pluginBodyTail: identifyObj<t.PluginBodyTailComponentObject>(
        (v) => v.type === 'pluginBodyTail',
      ),
      popUp: identifyObj<t.PopUpComponentObject>((v) => v.type === 'popUp'),
      register: identifyObj<t.RegisterComponentObject>(
        (v) => v.type === 'register',
      ),
      select: identifyObj<t.SelectComponentObject>((v) => v.type === 'select'),
      scrollView: identifyObj<t.ScrollViewComponentObject>(
        (v) => v.type === 'scrollView',
      ),
      textField: identifyObj<t.TextFieldComponentObject>(
        (v) => v.type === 'textField',
      ),
      textView: identifyObj<t.TextViewComponentObject>(
        (v) => v.type === 'textView',
      ),
      video: identifyObj<t.VideoComponentObject>((v) => v.type === 'video'),
      view: identifyObj<t.ViewComponentObject>((v) => v.type === 'view'),
    },
    ecosObj: {
      audio(v: unknown) {},
      doc: identifyObj<
        t.EcosDocument<
          t.NameField<t.MimeType.Pdf | t.MimeType.Json>,
          t.DocMediaType
        >
      >(
        (v) =>
          i.hasNameField<t.EcosDocument>(v) &&
          (/application\//i.test(v.name?.type || '') ||
            v.subtype?.mediaType === 1),
      ),
      font(v: unknown) {},
      image: identifyObj<
        t.EcosDocument<t.NameField<t.MimeType.Image>, t.ImageMediaType>
      >(
        (v) =>
          i.hasNameField<t.EcosDocument>(v) &&
          (/image/i.test(v.name?.type || '') || v.subtype?.mediaType === 4),
      ),
      message(v: unknown) {},
      model(v: unknown) {},
      multipart(v: unknown) {},
      other: identifyObj<t.EcosDocument<t.NameField<any>, t.OtherMediaType>>(
        (v) =>
          i.hasNameField<t.EcosDocument>(v) &&
          (!/(application|audio|font|image|multipart|text|video)\//i.test(
            v.name?.type || '',
          ) ||
            v.subtype?.mediaType === 0),
      ),
      text: identifyObj<
        t.EcosDocument<
          t.NameField<t.MimeType.Text>,
          t.TextMediaType | t.OtherMediaType
        >
      >(
        (v) =>
          i.hasNameField<t.EcosDocument>(v) &&
          (/text\//i.test(v.name?.type || '') ||
            v.subtype?.mediaType === 8 ||
            v.subtype?.mediaType === 0),
      ),

      video: identifyObj<
        t.EcosDocument<t.NameField<t.MimeType.Video>, t.VideoMediaType>
      >(
        (v) =>
          i.hasNameField<t.EcosDocument>(v) &&
          (/video\//i.test(v.name?.type || '') || v.subtype?.mediaType === 9),
      ),
    },
    emit: identifyObj<t.EmitObject>((v) => 'actions' in v),
    goto: identifyObj<t.GotoObject>((v) => 'goto' in v),
    if: identifyObj<t.IfObject>((v) => 'if' in v),
    mediaType: {
      audio: identifyNum<t.AudioMediaType>((v) => v == 2),
      doc: identifyNum<t.DocMediaType>((v) => v == 1),
      font: identifyNum<t.FontMediaType>((v) => v == 3),
      image: identifyNum<t.ImageMediaType>((v) => v == 4),
      message: identifyNum<t.MessageMediaType>((v) => v == 5),
      model: identifyNum<t.ModelMediaType>((v) => v == 6),
      multipart: identifyNum<t.MultipartMediaType>((v) => v == 7),
      other: identifyNum<t.OtherMediaType>((v) => v == 0),
      text: identifyNum<t.TextMediaType>((v) => v == 8),
      video: identifyNum<t.VideoMediaType>((v) => v == 9),
    },
    rootKey: (v = '') =>
      !!(v && v[0]?.toUpperCase() === v[0] && !i.Regex.onlyNumbers.test(v)),
    localKey: (v = '') =>
      !!(v && v[0]?.toLowerCase() === v[0] && !i.Regex.onlyNumbers.test(v)),
    reference: identifyStr<t.ReferenceString>((v) => {
      if (!i.isStr(v)) return false
      if (v === '.yml') return false
      if (v.startsWith('.')) return true
      if (v.startsWith('=')) return true
      if (v.startsWith('@')) return true
      if (v.startsWith('~')) return true
      if (/^[_]+\./.test(v)) return true
      return false
    }),
    localReference: isLocalReference,
    awaitReference: isAwaitReference,
    evalReference: isEvalReference,
    evalLocalReference: isEvalLocalReference,
    evalRootReference: isEvalRootReference,
    rootReference: isRootReference,
    tildeReference: isTildeReference,
    traverseReference: isTraverseReference,
    /**
     * Returns true if the string is in the format: `${string}@${string}#${string}`
     * @param v
     * @returns { boolean }
     */
    pageComponentUrl<S extends string>(v: S | undefined) {
      if (!i.isStr(v)) return false
      const parts = v.split(/(@|#)/)
      if (parts.length !== 5) return false
      const [_, separator1, __, separator2, ___] = parts
      return separator1 === '@' && separator2 === '#'
    },
    textBoard(v: unknown): v is t.TextBoardObject {
      return i.isArr(v) && v.some(o.textBoardItem)
    },
    textBoardItem<O extends { br: any } | 'br'>(v: O) {
      if (i.isObj(v)) return 'br' in v
      if (i.isStr(v)) return v === 'br'
      return false
    },
  }

  const folds = {
    actionChain: identifyArr<
      (t.ActionObject | t.EmitObjectFold | t.GotoObject)[]
    >(
      (v) =>
        i.isArr(v) &&
        v.some(
          composeSomes(
            o.action.any,
            (v: any) => i.isObj(v) && 'emit' in v,
            (v: any) => i.isObj(v) && 'goto' in v,
          ),
        ),
    ),
    component: Object.assign(
      {
        any<O extends PlainObject>(v: unknown): v is t.ComponentObject & O {
          return (
            i.isObj(v) &&
            'type' in v &&
            componentTypes.some((t) => v.type === t)
          )
        },
      },
      Object.assign(
        {} as {
          [K in ComponentType]: <K extends t.ComponentType>(
            v: unknown,
          ) => v is Omit<t.ActionObject, 'type'> & { type: K }
        },
        componentTypes.reduce(
          (acc, type) =>
            Object.assign(acc, {
              [type]: (v: unknown) => i.isObj(v) && v['type'] === type,
            }),
          {},
        ),
      ),
    ),
    emit: identifyObj<t.EmitObjectFold>((v) => 'emit' in v),
    goto: identifyObj<{ goto: t.GotoUrl | t.GotoObject }>((v) => 'goto' in v),
    if: identifyObj<{ if: t.IfObject }>((v) => 'if' in v),
    path: identifyObj<{ path: t.Path }>((v) => 'path' in v),
    textFunc: identifyObj<{ path: t.Path }>((v) => 'text=func' in v),
    toast: identifyObj<{ toast: t.ToastObject }>((v) => 'toast' in v),
  }

  return {
    ...o,
    folds,
  }
})()

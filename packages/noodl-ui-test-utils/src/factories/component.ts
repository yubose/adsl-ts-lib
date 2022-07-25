import type { LiteralUnion } from 'type-fest'
import * as u from '@jsmanifest/utils'
import type {
  ButtonComponentObject,
  CanvasComponentObject, // 9
  DividerComponentObject,
  EcosDocComponentObject,
  FooterComponentObject,
  HeaderComponentObject,
  ImageComponentObject,
  LabelComponentObject,
  ListComponentObject,
  ListItemComponentObject,
  PageComponentObject,
  PluginBodyTailComponentObject,
  PluginBodyTopComponentObject,
  PluginComponentObject,
  PluginHeadComponentObject,
  PopUpComponentObject,
  RegisterComponentObject,
  ScrollViewComponentObject,
  SelectComponentObject,
  TextFieldComponentObject,
  TextViewComponentObject,
  VideoComponentObject,
  ViewComponentObject,
} from 'noodl-types'
import { mergeObject, strOrEmptyStr } from '../utils'
import ecosJpgDoc from '../fixtures/jpg.json'
import ecosNoteDoc from '../fixtures/note.json'
import ecosPdfDoc from '../fixtures/pdf.json'
import ecosPngDoc from '../fixtures/png.json'
import ecosTextDoc from '../fixtures/text.json'
import actionFactory from './action'
import * as t from '../types'

const componentFactory = (function () {
  function button<Text extends string>(
    text: Text,
  ): ButtonComponentObject & { text: Text }

  function button(props?: Partial<ButtonComponentObject>): ButtonComponentObject

  function button(onClick?: any[]): ButtonComponentObject

  function button(): ButtonComponentObject

  function button<Text extends string>(
    props?: Text | Partial<ButtonComponentObject> | any[],
  ) {
    const comp = { type: 'button' } as ButtonComponentObject
    if (u.isStr(props)) comp.text = props
    else if (u.isArr(props)) comp.onClick = props
    else mergeObject(comp, props)
    return comp
  }

  function canvas<DataKey extends string>(
    dataKey: DataKey,
  ): CanvasComponentObject & { dataKey: DataKey }

  function canvas(props?: Partial<CanvasComponentObject>): CanvasComponentObject

  function canvas(): CanvasComponentObject

  function canvas<DataKey extends string, O extends CanvasComponentObject>(
    props?: DataKey | Partial<O>,
  ) {
    const comp = { type: 'canvas', dataKey: '' } as CanvasComponentObject
    if (u.isStr(props)) comp.dataKey = props
    return u.assign(comp, u.isObj(props) ? props : undefined)
  }

  function ecosDocComponent(
    preset?: t.GetEcosDocObjectPreset,
  ): EcosDocComponentObject

  function ecosDocComponent<C extends EcosDocComponentObject>(
    props?: Partial<C>,
  ): EcosDocComponentObject

  function ecosDocComponent<C extends EcosDocComponentObject>(
    props?: Partial<C> | t.GetEcosDocObjectPreset,
  ): EcosDocComponentObject {
    const obj = { type: 'ecosDoc' } as EcosDocComponentObject
    if (u.isStr(props)) {
      if (props === 'image') {
        obj.ecosObj = ecosPngDoc || ecosJpgDoc
      } else if (props === 'note') {
        obj.ecosObj = ecosNoteDoc
      } else if (props === 'pdf') {
        obj.ecosObj = ecosPdfDoc
      } else if (props === 'text') {
        obj.ecosObj = ecosTextDoc
      }
    } else if (u.isObj(props)) {
      if ('ecosObj' in props) {
        u.assign(obj, props)
      } else {
        u.assign(obj, props, {
          ecosObj: actionFactory.ecosDoc(props as any),
        })
      }
    }
    return obj
  }

  function divider(props?: Partial<DividerComponentObject>) {
    return u.merge(
      { type: 'divider' } as DividerComponentObject,
      props as DividerComponentObject,
    )
  }

  function footer<O extends FooterComponentObject>(props?: Partial<O>) {
    return { type: 'footer', ...props } as FooterComponentObject
  }

  function header(
    props?: Partial<HeaderComponentObject>,
  ): HeaderComponentObject {
    if (u.isUnd(props)) return { type: 'header' }
    return { type: 'header', ...props }
  }

  function image<Path extends string>(
    path: Path,
  ): ImageComponentObject & { path: Path }

  function image(props?: Partial<ImageComponentObject>): ImageComponentObject

  function image(): ImageComponentObject

  function image<Path extends string>(
    props?: Path | Partial<ImageComponentObject>,
  ) {
    return { type: 'image', path: strOrEmptyStr(props) } as ImageComponentObject
  }

  function label<DataKey extends string>(
    dataKey: DataKey,
  ): LabelComponentObject & { dataKey: DataKey }

  function label(props?: Partial<LabelComponentObject>): LabelComponentObject

  function label(): LabelComponentObject

  function label<DataKey extends string>(
    obj?: DataKey | Partial<LabelComponentObject>,
  ) {
    const comp = { type: 'label' } as LabelComponentObject
    if (u.isStr(obj)) comp.dataKey = obj
    return {
      ...comp,
      ...(u.isObj(obj) ? obj : undefined),
    } as LabelComponentObject
  }

  function list<ListObjectRef extends string>(
    listObject: ListObjectRef,
  ): ListComponentObject & { listObject: ListObjectRef }

  function list<ListObjectArr extends any[]>(
    listObject: ListObjectArr,
  ): ListComponentObject & { listObject: any[] }

  function list<ListObjectArr extends ListComponentObject>(
    props?: Partial<ListComponentObject>,
  ): ListComponentObject

  function list<
    ListObjectRef extends string = string,
    ListObjectArr extends any[] = any[],
  >(args?: ListObjectRef | ListObjectArr | Partial<ListComponentObject>) {
    const component = {
      type: 'list',
      contentType: 'listObject',
      iteratorVar: 'itemObject',
      listObject: '',
    } as ListComponentObject
    if (u.isUnd(args)) return component
    if (u.isArr(args)) return { ...component, listObject: args }
    if (u.isStr(args)) return { ...component, listObject: args }
    if (u.isObj(args)) return { ...component, ...args }
    return component
  }

  function listItem<IteratorVar extends string>(
    iteratorVar: LiteralUnion<IteratorVar | 'itemObject', string>,
  ): ListItemComponentObject & { [K in IteratorVar]: string }

  function listItem<
    IteratorVar extends string,
    DataObject extends Record<string, any>,
  >(
    iteratorVar: LiteralUnion<IteratorVar | 'itemObject', string>,
    dataObject?: DataObject,
  ): ListItemComponentObject & { [K in IteratorVar]: DataObject }

  function listItem(
    props: Partial<ListItemComponentObject>,
  ): ListItemComponentObject

  function listItem(
    props: Partial<ListItemComponentObject>,
    dataObject?: any,
  ): ListItemComponentObject

  function listItem(): ListItemComponentObject & { itemObject: '' }

  function listItem<IteratorVar extends string = string, DataObject = any>(
    arg1?:
      | string
      | Partial<
          ListItemComponentObject & {
            iteratorVar?: LiteralUnion<IteratorVar | 'itemObject', string>
          }
        >
      | DataObject,
    arg2?: DataObject,
  ) {
    const comp = { type: 'listItem' } as ListItemComponentObject
    if (u.isUnd(arg1)) return { ...comp, itemObject: '' }
    if (u.isStr(arg1)) {
      if (arg2) comp[arg1] = arg2
      else comp[arg1] = ''
    }
    if (u.isObj(arg1)) {
      u.assign(comp, arg1)
      if (arg2) comp.itemObject = arg2
      else if (!('itemObject' in arg1)) comp.itemObject = ''
    }
    return comp
  }

  function page<Path extends string>(
    path: Path,
  ): PageComponentObject & { path: Path }

  function page(): PageComponentObject & { path: string }

  function page(
    props: Partial<PageComponentObject>,
  ): PageComponentObject & { path: string }

  function page<Path extends string, O extends PageComponentObject>(
    obj?: Path | Partial<O>,
  ) {
    const comp = { type: 'page', path: '' } as PageComponentObject
    if (u.isUnd(obj)) return comp
    if (u.isStr(obj)) comp.path = obj
    else if (u.isObj(obj)) u.assign(comp, obj)
    return comp
  }

  function plugin<Path extends string>(
    path: Path,
  ): PluginComponentObject & { path: Path }

  function plugin(props?: Partial<PluginComponentObject>): PluginComponentObject

  function plugin(): PluginComponentObject

  function plugin<O extends PluginComponentObject>(
    props?: string | Partial<O>,
  ) {
    return {
      type: 'plugin',
      path: strOrEmptyStr(props),
      ...(u.isObj(props) ? props : undefined),
    } as PluginComponentObject
  }

  function pluginHead<Path extends string>(
    path: Path,
  ): PluginHeadComponentObject & { path: Path }

  function pluginHead(
    props?: Partial<PluginHeadComponentObject>,
  ): PluginHeadComponentObject

  function pluginHead(): PluginHeadComponentObject

  function pluginHead(props?: string | Partial<PluginHeadComponentObject>) {
    return {
      type: 'pluginHead',
      path: strOrEmptyStr(props),
      ...(u.isObj(props) ? props : undefined),
    } as PluginHeadComponentObject
  }

  function pluginBodyTop<Path extends string>(
    path: Path,
  ): PluginBodyTopComponentObject & { path: Path }

  function pluginBodyTop(
    props?: Partial<PluginBodyTopComponentObject>,
  ): PluginBodyTopComponentObject

  function pluginBodyTop(): PluginBodyTopComponentObject

  function pluginBodyTop<C extends PluginBodyTopComponentObject>(
    props?: string | Partial<C>,
  ) {
    return {
      type: 'pluginBodyTop',
      path: strOrEmptyStr(props),
      ...(u.isObj(props) ? props : undefined),
    } as PluginBodyTopComponentObject
  }

  function pluginBodyTail<Path extends string>(
    path: Path,
  ): PluginBodyTailComponentObject & { path: Path }

  function pluginBodyTail(
    props?: Partial<PluginBodyTailComponentObject>,
  ): PluginBodyTailComponentObject

  function pluginBodyTail(): PluginBodyTailComponentObject

  function pluginBodyTail<O extends Partial<PluginBodyTailComponentObject>>(
    props?: string | O,
  ) {
    return {
      type: 'pluginBodyTail',
      path: strOrEmptyStr(props),
      ...(u.isObj(props) ? props : undefined),
    } as PluginBodyTailComponentObject
  }

  function popUpComponent<PopUpView extends string>(
    popUpView: PopUpView,
  ): PopUpComponentObject & { popUpView: PopUpView }

  function popUpComponent(
    props?: Partial<PopUpComponentObject>,
  ): PopUpComponentObject

  function popUpComponent(): PopUpComponentObject

  function popUpComponent<
    PopUpView extends string,
    O extends PopUpComponentObject,
  >(arg?: PopUpView | Partial<O>) {
    const comp = { type: 'popUp', popUpView: '' }
    if (u.isUnd(arg)) return comp
    if (u.isStr(arg)) comp.popUpView = arg
    else if (u.isObj(arg)) u.assign(comp, arg)
    return comp as PopUpComponentObject
  }

  function register<OnEvent extends string>(
    onEvent: OnEvent,
  ): RegisterComponentObject & { onEvent: OnEvent }

  function register(
    props?: Partial<RegisterComponentObject>,
  ): RegisterComponentObject

  function register(): RegisterComponentObject

  function register<OnEvent extends string, O extends RegisterComponentObject>(
    arg?: OnEvent | Partial<O>,
  ) {
    const comp = { type: 'register' } as RegisterComponentObject
    if (u.isUnd(arg)) return comp
    if (u.isStr(arg)) comp.onEvent = arg
    else if (u.isObj(arg)) u.assign(comp, arg)
    return comp
  }

  function select<OptionsRef extends string>(
    options: OptionsRef,
  ): SelectComponentObject & { options: OptionsRef }

  function select<Options extends any[]>(
    options: Options,
  ): SelectComponentObject & { options: Options }

  function select<Options extends any = any>(
    props: Partial<SelectComponentObject>,
    options?: Options,
  ): SelectComponentObject & { options: Options }

  function select(): SelectComponentObject

  function select<O extends SelectComponentObject>(
    arg1?: string | any[] | Partial<O>,
    arg2?: any,
  ) {
    const comp = { type: 'select' } as SelectComponentObject
    if (u.isUnd(arg1)) return u.assign(comp, { options: '' })
    if (u.isUnd(arg2)) {
      if (u.isArr(arg1)) comp.options = arg1
      else u.assign(comp, u.isObj(arg1) ? arg1 : undefined)
    }
    return comp
  }

  function scrollView<O extends ScrollViewComponentObject>(props?: Partial<O>) {
    return { type: 'scrollView', ...props }
  }

  function textField<DataKey extends string>(
    dataKey: DataKey,
  ): TextFieldComponentObject & { dataKey: DataKey }

  function textField(
    props: Partial<TextFieldComponentObject>,
  ): TextFieldComponentObject

  function textField(): TextFieldComponentObject

  function textField<
    DataKey extends string,
    O extends TextFieldComponentObject,
  >(arg?: DataKey | Partial<O>) {
    const comp = { type: 'textField' }
    if (u.isStr(arg)) return u.assign(comp, { dataKey: arg })
    return u.assign(comp, arg)
  }

  function textView<O extends TextViewComponentObject>(props?: Partial<O>) {
    return { type: 'textView', ...props }
  }

  function video<Path extends string>(
    path: Path,
  ): VideoComponentObject & { path: Path }

  function video(props: Partial<VideoComponentObject>): VideoComponentObject

  function video(): VideoComponentObject

  function video<O extends VideoComponentObject>(props?: string | Partial<O>) {
    const comp = { type: 'video' } as VideoComponentObject
    if (u.isUnd(props)) return comp
    if (u.isStr(props)) comp.path = props
    else if (u.isObj(props)) u.assign(comp, props)
    return comp
  }

  function view<O extends ViewComponentObject>(obj?: Partial<O>) {
    return { type: 'view', ...obj }
  }

  return {
    button,
    canvas,
    ecosDocComponent,
    divider,
    footer,
    header,
    image,
    label,
    list,
    listItem,
    page,
    plugin,
    pluginHead,
    pluginBodyTop,
    pluginBodyTail,
    popUpComponent,
    register,
    select,
    scrollView,
    textField,
    textView,
    video,
    view,
  }
})()

export default componentFactory

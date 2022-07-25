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
import builder from '../builder'
import {
  mergeObject,
  mergeKeyValOrObj,
  strOrUndef,
  strOrEmptyStr,
} from '../utils'
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
    const comp = builder.component('button')
    if (u.isStr(props)) comp.createProperty('text', props)
    else if (u.isArr(props)) comp.createProperty('onClick', props)
    else mergeObject(comp, props)
    return comp.build()
  }

  function canvas<DataKey extends string>(
    dataKey: DataKey,
  ): CanvasComponentObject & { dataKey: DataKey }

  function canvas(props?: Partial<CanvasComponentObject>): CanvasComponentObject

  function canvas(): CanvasComponentObject

  function canvas<DataKey extends string, O extends CanvasComponentObject>(
    props?: DataKey | Partial<O>,
  ) {
    const comp = builder.component('canvas')
    comp.createProperty('dataKey', '')
    if (u.isStr(props)) comp.setValue('dataKey', props)
    return mergeObject(comp, props).build()
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
    return mergeObject<DividerComponentObject>(
      builder.component('divider'),
      props,
    ).build()
  }

  function footer<O extends FooterComponentObject>(props?: Partial<O>) {
    return mergeObject<O>(builder.component('footer'), props).build()
  }

  function header(
    props?: Partial<HeaderComponentObject>,
  ): HeaderComponentObject {
    if (u.isUnd(props)) return { type: 'header' }
    return mergeObject<HeaderComponentObject>(
      builder.component('header'),
      props,
    ).build()
  }

  function image<Path extends string>(
    path: Path,
  ): ImageComponentObject & { path: Path }

  function image(props?: Partial<ImageComponentObject>): ImageComponentObject

  function image(): ImageComponentObject

  function image<Path extends string>(
    props?: Path | Partial<ImageComponentObject>,
  ) {
    return mergeKeyValOrObj<ImageComponentObject>(
      builder.component('image'),
      'path',
      strOrEmptyStr(props),
      props,
    ).build()
  }

  function label<DataKey extends string>(
    dataKey: DataKey,
  ): LabelComponentObject & { dataKey: DataKey }

  function label(props?: Partial<LabelComponentObject>): LabelComponentObject

  function label(): LabelComponentObject

  function label<DataKey extends string>(
    obj?: DataKey | Partial<LabelComponentObject>,
  ) {
    const comp = builder.component('label')
    if (u.isStr(obj)) comp.createProperty('dataKey', obj)
    return mergeObject(comp, obj).build()
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
    const component = builder.component('list')
    component.createProperty('iteratorVar', 'itemObject')
    component.createProperty('contentType', 'listObject')
    component.createProperty('listObject', '')
    if (u.isUnd(args)) {
      return component.build()
    }
    if (u.isArr(args)) {
      return component.setValue('listObject', args).build()
    }
    if (u.isObj(args)) {
      return mergeObject(component, args).build()
    }
    if (u.isStr(args)) {
      component.createProperty('listObject', args)
      return component.build()
    }
    return mergeObject(component, args).build()
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
    const comp = builder.component('listItem')
    if (u.isUnd(arg1)) {
      comp.createProperty('itemObject', '')
      return comp.build()
    }
    if (u.isStr(arg1)) {
      if (arg2) comp.createProperty(arg1, arg2)
      else comp.createProperty(arg1, '')
    }
    if (u.isObj(arg1)) {
      mergeObject(comp, arg1)
      if (arg2) comp.setValue('itemObject', arg2)
      else if (!('itemObject' in arg1)) comp.createProperty('itemObject', '')
    }
    return comp.build()
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
    const comp = builder.component('page')
    comp.createProperty('path', '')
    if (u.isUnd(obj)) return comp.build()
    if (u.isStr(obj)) comp.setValue('path', obj)
    else if (u.isObj(obj)) mergeObject(comp, obj)
    return comp.build()
  }

  function plugin<Path extends string>(
    path: Path,
  ): PluginComponentObject & { path: Path }

  function plugin(props?: Partial<PluginComponentObject>): PluginComponentObject

  function plugin(): PluginComponentObject

  function plugin<O extends PluginComponentObject>(
    props?: string | Partial<O>,
  ) {
    return mergeKeyValOrObj(
      builder.component('plugin'),
      'path',
      u.isStr(props) ? props : '',
      props,
    ).build()
  }

  function pluginHead<Path extends string>(
    path: Path,
  ): PluginHeadComponentObject & { path: Path }

  function pluginHead(
    props?: Partial<PluginHeadComponentObject>,
  ): PluginHeadComponentObject

  function pluginHead(): PluginHeadComponentObject

  function pluginHead(props?: string | Partial<PluginHeadComponentObject>) {
    return mergeKeyValOrObj(
      builder.component('pluginHead'),
      'path',
      u.isStr(props) ? props : '',
      props,
    ).build()
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
    return mergeKeyValOrObj(
      builder.component('pluginBodyTop'),
      'path',
      u.isStr(props) ? props : '',
      props,
    ).build()
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
    return mergeKeyValOrObj(
      builder.component('pluginBodyTail'),
      'path',
      u.isStr(props) ? props : '',
      props,
    ).build()
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
    const comp = builder.component('popUp')
    comp.createProperty('popUpView', '')
    if (u.isUnd(arg)) return comp.build()
    if (u.isStr(arg)) comp.createProperty('popUpView', arg)
    else if (u.isObj(arg)) mergeObject(comp, arg)
    return comp.build()
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
    const comp = builder.component('register')
    if (u.isUnd(arg)) return comp.build()
    if (u.isStr(arg)) comp.createProperty('onEvent', arg)
    else if (u.isObj(arg)) mergeObject(comp, arg)
    return comp.build()
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
    const comp = builder.component('select')
    if (u.isUnd(arg1)) return mergeObject(comp, { options: '' }).build()
    if (u.isUnd(arg2)) {
      if (u.isArr(arg1)) comp.createProperty('options', arg1)
      else mergeObject(comp, u.isObj(arg1) ? arg1 : undefined)
    }
    return comp.build()
  }

  function scrollView<O extends ScrollViewComponentObject>(props?: Partial<O>) {
    return mergeObject<O & ScrollViewComponentObject>(
      builder.component('scrollView'),
      props,
    ).build()
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
    const comp = builder.component('textField')
    if (u.isStr(arg)) return mergeObject(comp, { dataKey: arg }).build()
    return mergeObject(comp, arg).build()
  }

  function textView<O extends TextViewComponentObject>(props?: Partial<O>) {
    return mergeObject<O & TextViewComponentObject>(
      builder.component('textView'),
      props,
    ).build()
  }

  function video<Path extends string>(
    path: Path,
  ): VideoComponentObject & { path: Path }

  function video(props: Partial<VideoComponentObject>): VideoComponentObject

  function video(): VideoComponentObject

  function video<O extends VideoComponentObject>(props?: string | Partial<O>) {
    const comp = builder.component('video')
    if (u.isUnd(props)) return comp.build()
    if (u.isStr(props)) comp.createProperty('path', props)
    else if (u.isObj(props)) mergeObject(comp, props)
    return comp.build()
  }

  function view<O extends ViewComponentObject>(obj?: Partial<O>) {
    return mergeObject<O & ViewComponentObject>(
      builder.component('view'),
      obj,
    ).build()
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

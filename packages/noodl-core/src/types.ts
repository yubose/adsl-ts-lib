import type fs from 'fs'
import type * as noodlUtils from './utils/noodl'
import { _symbol } from './constants'

export abstract class AAccumulator {
  abstract init(): this
}

export abstract class AExtractor<INode = any> {
  abstract extract(data: Record<string, INode>): any[]
  abstract use(value: ARoot | AStructure | AVisitor): this
}

export abstract class AIterator<INode = any, INext = any> {
  abstract getIterator(
    data: ARoot | Record<string, INode>,
  ): Iterator<INode, any, INext>
}

export abstract class AFileSystem {
  abstract readFile(
    ...args: Parameters<typeof fs['readFile']>
  ): ReturnType<typeof fs['readFile']>
  abstract readFileSync(
    ...args: Parameters<typeof fs['readFileSync']>
  ): ReturnType<typeof fs['readFileSync']>
  abstract writeFile(...args: Parameters<typeof fs['writeFile']>): Promise<any>
  abstract writeFileSync(...args: Parameters<typeof fs['writeFileSync']>): any
}

export abstract class ARoot<V = any> {
  abstract init(): this
  abstract value: V
  abstract get(key: string): any
  abstract has(key: any): boolean
  abstract set(key: string, value: any): this
  abstract remove(key: string): this
  constructor() {
    Object.defineProperty(this, '_id_', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: _symbol.root,
    })
  }
}

export abstract class AStructure<Struct extends IStructure = IStructure> {
  abstract name: string
  abstract is(node: any): boolean
  abstract createStructure(node: any): Struct
}

export interface IStructure<S extends string = string> {
  raw: any
  group: S
}

export abstract class AVisitor<
  R = any,
  H = Record<string, any>,
  B extends BuiltIns = BuiltIns,
> {
  abstract callback?: (args: VisitFnArgs<H, any, B>) => any
  abstract visit(node: unknown, options?: Partial<VisitorOptions<H>>): R
  abstract visitAsync(
    node: unknown,
    options?: Partial<VisitorOptions<H>>,
  ): Promise<R>
  abstract use(callback: AVisitor<any, any, B>['callback']): this
}

export interface BuiltInFn<B extends BuiltIns = BuiltIns, DataIn = any> {
  (
    dataIn: DataIn,
    args?: {
      builtIns: B
      builtInKey: string
      builtInObject: any
      builtInPath: string
      data: Record<string, any>
      dataOut: any
      node: any
      page: string
      root: ARoot
    },
  ): any
}

export interface BuiltIns {
  [key: string]: BuiltInFn | BuiltIns
}

export interface VisitorAsserter<
  N = unknown,
  H = Record<string, any>,
  B extends BuiltIns = BuiltIns,
> {
  cond: (node: N) => boolean
  fn(args: VisitFnArgs<H, N, B>): any
}

export interface VisitorOptions<
  H = Record<string, any>,
  InitOptions extends Record<string, any> = Record<string, any>,
  Asserters = any,
  B extends BuiltIns = BuiltIns,
> {
  asserters: Asserters
  builtIn: B
  data: Record<string, any>
  init?: (args: VisitorInitArgs<InitOptions>) => any
  helpers?: H
  page?: string
  path?: (number | string)[]
  root: ARoot
}

export type VisitorInitArgs<
  InitOptions extends Record<string, any> = Record<string, any>,
> = InitOptions & Record<string, any> & { data: Record<string, any> }

export type VisitFnArgs<
  H extends Record<string, any> = Record<string, any>,
  N = unknown,
  B extends BuiltIns = BuiltIns,
> = H &
  VisitorHelpers<H, B> & {
    data: Record<string, any>
    page?: string
    key?: number | string | null
    node: N
    root: ARoot
  }

export type VisitorHelpers<
  H extends Record<string, any> = Record<string, any>,
  B extends BuiltIns = BuiltIns,
> = H &
  Pick<typeof noodlUtils, 'isValidViewTag'> & {
    isValidPageValue(page: string): boolean
  } & { builtIn?: B }

export type NormalizePropsContext = Record<string, any> & {
  dataObject?: Record<string, any>
  iteratorVar?: string
  index?: number
  listObject?: any[] | string
}

export type Path = (number | string | symbol)[]

export interface IViewport {
  width: number
  height: number
}

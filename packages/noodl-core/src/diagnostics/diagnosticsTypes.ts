import type { LiteralUnion } from 'type-fest'
import type { BuiltIns, VisitFnArgs, VisitorInitArgs } from '../types'
import type Diagnostic from './Diagnostic'
import type { DiagnosticCode } from '../constants'

export interface IDiagnostics {
  run(options?: RunOptions): Diagnostic[]
  runAsync(options?: RunOptions): Promise<Diagnostic[]>
}

export interface DiagnosticsHelpers<
  M extends Record<string, any> = Record<string, any>,
> {
  /**
   * Add a Diagnostic object.
   *
   * If a function is provided it will be called providing the newly constructed Diagnostic as its first argument and all of the current diagnostics as its second argument. This provides full control with how the Diagnostic will be generated in the output
   * - The second argument will be treated as the current page
   * - The third argument will be treated as the current visiting node
   *
   * If a DiagnosticLevel is provided it will treat the second argument as a DiagnosticCode or message.
   * - If the second argument is a DiagnosticCode it will treat the third argument as an args object for generating the diagnostic, the fourth argument as the current page and the fifth as the current visiting node
   * - If the second argument is a string it will be used as the diagnostic message
   *
   * If a DiagnosticCode is provided it will treat the second argument as an args object if it is an object, the third argument as the current page and the fourth argument as the current visiting node
   *
   * If the entire diagnostic object is provided it will treat the second argument as the current page and the third argument as the current visiting node
   *
   * @param arg1
   * @param argsOrCodeOrMessageOrPage
   * @param messageOrCodeOrPageOrNode
   * @param arg4
   * @param arg5
   */
  add(
    arg1:
      | DiagnosticCode
      | DiagnosticLevel
      | DiagnosticObjectMessage
      | ((diagnostic: Diagnostic, diagnostics: Diagnostic[]) => void),
    argsOrCodeOrMessageOrPage?: Record<string, any> | number | string,
    messageOrCodeOrPageOrNode?: any,
    arg4?: any,
    arg5?: any,
  ): void
  markers: Markers<M>
}

export type DiagnosticObject<
  H extends Record<string, any> = Record<string, any>,
> = Partial<Pick<VisitFnArgs<H>, 'data' | 'key' | 'page'>> & {
  messages?: DiagnosticObjectMessage[]
}

export interface DiagnosticObjectMessage {
  code?: DiagnosticCode
  type: DiagnosticLevel
  message?: string
}

export type DiagnosticLevel = 'error' | 'info' | 'warn'

export type DefaultMarkerKey = LiteralUnion<
  'appConfig' | 'assetsUrl' | 'baseUrl' | 'pages' | 'preload' | 'rootConfig',
  string
>

export type Markers<O extends Record<string, any> = Record<string, any>> = O & {
  assetsUrl: string
  baseUrl: string
  preload: string[]
  pages: string[]
} & { rootConfig: string; appConfig: string }

export interface RunOptions<
  Asserters = any,
  BuiltInFns extends BuiltIns = BuiltIns,
> {
  asserters?: Asserters
  builtIn?: BuiltInFns
  init?: (args: VisitorInitArgs<DiagnosticsHelpers>) => any
  dataIn?(opts: {
    builtInKey: `=.builtIn.${string}`
    builtInObject?: any
    dataOut?: any
  }): any
  enter?(args: VisitFnArgs<DiagnosticsHelpers, any, BuiltInFns>): any
}

import AppConfig from '../AppConfig'
import RootConfig from '../RootConfig'
import Builder from '../Builder'
import Diagnostic from './Diagnostic'
import { generateDiagnostic, isDiagnosticLevel } from './utils'
import type {
  IDiagnostics,
  DefaultMarkerKey,
  DiagnosticsHelpers,
  DiagnosticObject,
  Markers,
  RunOptions,
} from './diagnosticsTypes'
import * as fp from '../utils/fp'
import * as is from '../utils/is'
import * as t from '../types'

class Diagnostics<Asserters = any, BuiltInFns extends t.BuiltIns = t.BuiltIns>
  extends Builder
  implements IDiagnostics
{
  #appConfig: AppConfig
  #rootConfig: RootConfig
  #markers = { rootConfig: '', appConfig: '' } as Markers
  #hooks = {
    addDiagnostic: [] as ((
      diagnostic: Diagnostic,
      page?: string,
      node?: any,
    ) => void)[],
  };

  [Symbol.iterator](): Iterator<[name: string, node: unknown], any, any> {
    // @ts-expect-error
    return this.root[Symbol.iterator]()
  }

  constructor() {
    super()
    this.#rootConfig = new RootConfig()
    this.#appConfig = new AppConfig()
  }

  get hooks() {
    return this.#hooks
  }

  get rootConfig() {
    return this.#rootConfig
  }

  get appConfig() {
    return this.#appConfig
  }

  get markers() {
    this.#markers.assetsUrl = this.#appConfig.assetsUrl
    this.#markers.baseUrl = this.#rootConfig.cadlBaseUrl
    this.#markers.preload = this.#appConfig.preload
    this.#markers.pages = this.#appConfig.page
    return this.#markers
  }

  mark(flag: DefaultMarkerKey, value: any) {
    if (/preload|page/.test(flag)) {
      this.#appConfig[flag === 'pages' ? 'page' : flag].push(value)
    } else if (flag === 'baseUrl') {
      this.#rootConfig.cadlBaseUrl = value
    } else if (flag === 'assetsUrl') {
      this.#appConfig.assetsUrl = value
    } else {
      this.markers[flag] = value
    }
    return this
  }

  run(args: RunOptions<Asserters, BuiltInFns> = {}) {
    const asserters = fp.toArr(args?.asserters ?? []).filter(Boolean)
    const builtIn = args?.builtIn
    const { diagnostics, options, originalVisitor } = this.#getRunnerProps(args)
    try {
      for (const [name, nodeProp] of this) {
        const { helpers, node } = this.#getVisitorProps({
          diagnostics,
          name,
          node: nodeProp,
        })
        this.visitor?.visit(node, {
          ...options,
          asserters,
          builtIn,
          helpers,
          page: name,
        } as t.VisitorOptions)
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error))
    } finally {
      if (originalVisitor) this.visitor?.use(originalVisitor)
    }

    return diagnostics
  }

  print(diagnostics: Diagnostic[]) {
    console.dir(
      diagnostics.map((diagnostic) => diagnostic.toJSON()),
      { depth: Infinity },
    )
  }

  async runAsync(args: RunOptions<Asserters, BuiltInFns> = {}) {
    const asserters = fp.toArr(args?.asserters ?? []).filter(Boolean)
    const builtIn = args?.builtIn
    const { diagnostics, options, originalVisitor } = this.#getRunnerProps(args)
    try {
      await Promise.all(
        [...this].map(([name, nodeProp]) => {
          const { helpers, node } = this.#getVisitorProps({
            diagnostics,
            name,
            node: nodeProp,
          })
          return this.visitor?.visitAsync(node, {
            ...options,
            asserters,
            builtIn,
            page: name,
            helpers,
          } as t.VisitorOptions)
        }),
      )
      return diagnostics
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error))
    } finally {
      if (originalVisitor) this.visitor?.use(originalVisitor)
    }
  }

  #getRunnerProps = <Asserters = any>(args: RunOptions<Asserters>) => {
    const originalVisitor = this.visitor?.callback

    if (args.enter) {
      this.visitor?.use(args.enter)
    } else {
      this.visitor?.use((args) => originalVisitor?.(args))
    }

    const diagnostics = [] as Diagnostic[]
    const options = {
      init: args.init,
      data: this.createData({ diagnostics }),
      root: this.root as t.ARoot,
    }

    return {
      diagnostics,
      options,
      originalVisitor,
    }
  }

  #getVisitorProps = ({
    diagnostics,
    name: page,
    node,
  }: {
    diagnostics: Diagnostic[]
    name: string
    node: unknown
  }) => {
    const diagnosticsHelpers = {
      add: (arg1, arg2, arg3, arg4, arg5) => {
        let p = ''
        let n: any

        const diagnostic = new Diagnostic()

        if (is.fnc(arg1)) {
          if (is.str(arg2)) p = arg2
          if (arg3) n = arg3
          arg1(diagnostic, diagnostics)
        } else if (isDiagnosticLevel(arg1)) {
          if (is.num(arg2)) {
            if (is.obj(arg3)) {
              if (is.str(arg4)) {
                p = arg4
                if (arg5) n = arg5
              }
            }
            const obj = generateDiagnostic(arg2, arg3)
            diagnostic[arg1](obj.code, obj.message)
          } else if (is.str(arg2)) {
            diagnostic[arg1](arg2)
          } else {
            diagnostic.set('type', arg1)
          }
        } else if (is.num(arg1)) {
          if (is.obj(arg2) || is.str(arg2)) {
            diagnostic.info(arg1, arg2)
            if (is.str(arg3)) {
              p = arg3
              if (arg4) n = arg4
            }
          }
        } else if (is.obj(arg1)) {
          for (const [k, v] of fp.entries(arg1)) diagnostic.set(k, v)
          if (is.str(arg2)) {
            p = arg2
            if (arg3) n = arg3
          }
        }

        if (!p) p = page
        if (!n) n = node

        if (!diagnostic.get('page')) diagnostic.set('page', p)

        this.hooks.addDiagnostic.forEach((fn) => fn(diagnostic, p, n))
        diagnostics.push(diagnostic)
      },
      markers: this.#markers,
    } as DiagnosticsHelpers

    return this.createProps({
      helpers: this.createHelpers(diagnosticsHelpers),
      name: page,
      node,
    })
  }

  on<Evt extends 'addDiagnostic'>(
    evt: Evt,
    fn: Diagnostics['hooks'][Evt][number],
  ) {
    if (evt === 'addDiagnostic') {
      this.hooks.addDiagnostic.push(fn)
    }
    return this
  }
}

export default Diagnostics

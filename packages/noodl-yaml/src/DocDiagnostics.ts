import { consts, Diagnostic, Diagnostics, is as coreIs, fp } from 'noodl-core'
import type { BuiltIns, Builder } from 'noodl-core'
import getYamlNodeKind from './utils/getYamlNodeKind'
import DocDiagnosticMessages from './DocDiagnosticMessages'
import DocDiagnosticsIterator from './DocDiagnosticsIterator'
import DocRoot from './DocRoot'
import * as c from './constants'
import * as t from './types'

class DocDiagnostics<B extends BuiltIns = BuiltIns> extends Diagnostics<
  t.DocVisitorAssertConfig | t.DocVisitorAssertConfig[],
  B
> {
  constructor() {
    super()

    super.on('addDiagnostic', (diagnostic, page, node) => {
      if (node) {
        const kind = getYamlNodeKind(node)
        switch (kind) {
          case c.Kind.Scalar:
          case c.Kind.Pair:
          case c.Kind.Map:
          case c.Kind.Seq:
          case c.Kind.Document: {
            if (node.srcToken) {
              const { indent, items, offset, props, start, end, type } =
                node.srcToken || {}
              const range = node.range
              if (start) diagnostic.set('start', start)
              if (end) diagnostic.set('end', end)
              if (indent) diagnostic.set('indent', indent)
              if (items) diagnostic.set('items', items)
              if (offset) diagnostic.set('offset', offset)
              if (props) diagnostic.set('props', props)
              if (range) diagnostic.set('range', range)
              if (type) diagnostic.set('type', type)
            }
            break
          }
          case c.Kind.Unknown:
        }
      }
    })
  }

  /**
   *
   * @param helpers
   * @returns
   */
  createHelpers<H extends Record<string, any> = Record<string, any>>(
    helpers?: H,
  ) {
    const baseHelpers = super.createHelpers(helpers)

    return {
      ...baseHelpers,
    }
  }

  use(value: DocDiagnosticsIterator | Parameters<Builder['use']>[0]) {
    super.use(value)
    if (coreIs.root(value) || value instanceof DocRoot) {
      ;(value as DocRoot).use(new DocDiagnosticsIterator(this))
    }
    return this
  }

  codeExists(
    code: consts.DiagnosticCode,
    diagnostics: Diagnostic | Diagnostic[],
  ) {
    return new DocDiagnosticMessages(fp.toArr(diagnostics)).find(code)
  }

  messageExists(value: string, diagnostics: Diagnostic | Diagnostic[]) {
    return new DocDiagnosticMessages(fp.toArr(diagnostics)).find(value)
  }
}

export default DocDiagnostics

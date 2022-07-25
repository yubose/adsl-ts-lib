import { consts, Diagnostic, is as coreIs } from 'noodl-core'

/**
 * @internal
 */
class DocDiagnosticMessages {
  diagnostics: Diagnostic[];

  [Symbol.iterator]() {
    const diagnostics = [...this.diagnostics]
    return {
      next() {
        return {
          get value() {
            return diagnostics.pop()
          },
          get done() {
            return !diagnostics.length
          },
        }
      },
    }
  }

  constructor(diagnostics: Diagnostic[]) {
    this.diagnostics = diagnostics
  }

  createMessageFinder(value: string) {
    const regexp = new RegExp(value, 'i')
    return (diagnostic: Diagnostic) =>
      diagnostic.messages.find((message) => {
        if (coreIs.str(message.message)) return regexp.test(message.message)
        return false
      })
  }

  createCodeFinder(code: consts.DiagnosticCode) {
    return (diagnostic: Diagnostic) =>
      diagnostic.messages.find((message) => message.code === code)
  }

  find(codeOrMessage: consts.DiagnosticCode | string) {
    const fn = coreIs.str(codeOrMessage)
      ? this.createMessageFinder(codeOrMessage)
      : this.createCodeFinder(codeOrMessage)
    for (const diagnostic of this) {
      if (diagnostic && fn(diagnostic)) return true
    }
    return false
  }
}

export default DocDiagnosticMessages

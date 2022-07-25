import { _symbol, DiagnosticCode } from '../constants'
import { generateDiagnostic } from './utils'
import type { DiagnosticObject, DiagnosticLevel } from './diagnosticsTypes'

class Diagnostic {
  #value = { messages: [] } as DiagnosticObject

  static create(
    type: DiagnosticLevel,
    codeOrMessage: DiagnosticCode | string,
    messageOrArgs?: Record<string, any> | string,
  ) {
    if (
      typeof codeOrMessage === 'number' &&
      typeof messageOrArgs === 'object'
    ) {
      return {
        type,
        ...generateDiagnostic(codeOrMessage, messageOrArgs),
      }
    }
    if (typeof codeOrMessage === 'string') {
      return { type, message: codeOrMessage }
    }
    return {
      type,
      ...(typeof codeOrMessage === 'number'
        ? { code: codeOrMessage }
        : undefined),
      ...(typeof messageOrArgs === 'string'
        ? { message: messageOrArgs }
        : undefined),
    }
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toJSON()
  }

  constructor() {
    Object.defineProperty(this, '_id_', {
      configurable: false,
      enumerable: false,
      writable: true,
      value: _symbol.diagnostic,
    })
  }

  get(key: string) {
    return this.#value[key]
  }

  set(key: string, value: any) {
    this.#value[key] = value
    return this
  }

  get messages() {
    return this.#value.messages as NonNullable<DiagnosticObject['messages']>
  }

  set messages(messages) {
    this.#value.messages = messages
  }

  error(
    codeOrMessage: DiagnosticCode | string,
    messageOrArgs?: Record<string, any> | string,
  ) {
    this.messages.push(Diagnostic.create('error', codeOrMessage, messageOrArgs))
    return this
  }

  info(
    codeOrMessage: DiagnosticCode | string,
    messageOrArgs?: Record<string, any> | string,
  ) {
    this.messages.push(Diagnostic.create('info', codeOrMessage, messageOrArgs))
    return this
  }

  warn(
    codeOrMessage: DiagnosticCode | string,
    messageOrArgs?: Record<string, any> | string,
  ) {
    this.messages.push(Diagnostic.create('warn', codeOrMessage, messageOrArgs))
    return this
  }

  toJSON() {
    return this.#value
  }

  toString() {
    return JSON.stringify(this.toJSON(), null, 2)
  }
}

export default Diagnostic

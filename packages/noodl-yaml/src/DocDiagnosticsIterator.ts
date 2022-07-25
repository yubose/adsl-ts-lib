import y from 'yaml'
import type DocDiagnostics from './DocDiagnostics'
import type DocRoot from './DocRoot'

class DocDiagnosticsIterator {
  #docDiagnostics: DocDiagnostics

  constructor(docDiagnostics: DocDiagnostics) {
    this.#docDiagnostics = docDiagnostics
  }

  getIterator(): Iterator<[name: string, doc: y.Document | y.Node]> {
    const entries = [
      ...(this.#docDiagnostics.root?.value as DocRoot['value']).entries(),
    ]

    const configKey = this.#docDiagnostics.markers.rootConfig
    const appConfigKey = this.#docDiagnostics.markers.appConfig
    const preloads = this.#docDiagnostics.markers.preload || []
    const pages = this.#docDiagnostics.markers.pages || []

    const toFront = (key: string) => {
      const index = entries.findIndex(([name]) => name === key)
      if (index > 0) {
        const entry = entries[index]
        entries.splice(index, 1)
        entries.unshift(entry)
      }
    }

    if (configKey) toFront(configKey)
    if (appConfigKey) toFront(appConfigKey)
    if (preloads.length) preloads.forEach((name) => toFront(name))
    if (pages.length) pages.forEach((page) => toFront(page))

    return {
      next() {
        return {
          get value() {
            return entries.pop()
          },
          get done() {
            return !entries.length as true
          },
        }
      },
    }
  }
}

export default DocDiagnosticsIterator

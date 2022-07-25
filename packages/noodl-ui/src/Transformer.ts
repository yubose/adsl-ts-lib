import log from './utils/log'
import resolveSetup from './resolvers/resolveSetup'
import resolveComponents from './resolvers/resolveComponents'
import resolveStyles from './resolvers/resolveStyles'
import resolveDataAttribs from './resolvers/resolveDataAttribs'
import * as t from './types'

class NuiTransformer {
  #transformers = [] as typeof resolveComponents[]
  #transform: (
    component: t.NuiComponent.Instance,
    options: t.ConsumerOptions,
  ) => Promise<void>

  constructor() {
    this.#transformers.push(
      resolveSetup,
      resolveComponents,
      resolveStyles,
      resolveDataAttribs,
    )

    let index = 0
    let resolver = this.#transformers[index]

    while (resolver) {
      resolver.next = this.#transformers[++index]
      resolver = resolver.next
    }

    this.#transform = this.#transformers[0].resolve.bind(this.#transformers[0])
  }

  async transform(
    component: t.NuiComponent.Instance,
    options: t.ConsumerOptions,
  ) {
    try {
      await this.#transform?.(component, options)
    } catch (error) {
      log.error(error instanceof Error ? error : new Error(String(error)))
    }
  }
}

export default NuiTransformer

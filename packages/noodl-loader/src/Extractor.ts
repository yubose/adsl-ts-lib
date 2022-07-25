import y from 'yaml'
import { ARoot } from 'noodl-core'
import { createFileSystem } from 'noodl-file'
import { ADisposable, disposeAll } from './Disposable'
import * as is from './utils/is'
import * as t from './types'

export interface ExtractCallback<INode = any> {
  (value: INode, options?: { key?: string; isValue?: boolean }): Asset
}

export interface AssetBase {
  type: string
  value: string
}

export interface AssetUrl extends AssetBase {
  host: string
}

export interface AssetFile extends AssetBase {
  path: string
}

export type Asset = AssetFile | AssetUrl

export function getAssetType(value: string | null | undefined) {
  if (typeof value !== 'string') return 'unknown'
  if (is.image(value)) {
    return 'image'
  } else if (is.script(value)) {
    return 'script'
  } else if (is.video(value)) {
    return 'video'
  } else if (is.text(value)) {
    return 'text'
  } else if (
    value.endsWith('pdf') ||
    value.endsWith('json') ||
    value.endsWith('doc')
  ) {
    return 'document'
  } else {
    return 'text'
  }
}

export function defaultExtractor(
  node: any,
  callback: ExtractCallback = (asset) => asset,
): Asset[] {
  const extract = (currentAssets: Asset[], node: unknown) => {
    if (node) {
      if (y.isMap(node)) {
        return currentAssets.concat(
          node.items.reduce((acc, pair) => {
            return acc.concat(extract(acc, extract(acc, pair)))
          }, [] as Asset[]),
        )
      } else if (y.isSeq(node)) {
        return currentAssets.concat(
          node.items.reduce((acc: Asset[], item) => {
            return acc.concat(extract(acc, item))
          }, []),
        )
      } else if (y.isPair(node)) {
        return extract(currentAssets, node.value)
      } else if (y.isDocument(node)) {
        return extract(currentAssets, node.contents)
      } else if (y.isScalar(node)) {
        if (typeof node.value === 'string') {
          const { value } = node
          if (is.url(value)) {
            const urlObject = new URL(value)
            currentAssets.push(
              callback({
                host: urlObject.host,
                path: urlObject.href,
                value,
                type: getAssetType(value),
              }),
            )
          } else {
            // Assuming it is a file path or file name
            currentAssets.push(
              callback({
                path: value,
                type: getAssetType(value),
                value,
              } as AssetFile),
            )
          }
        }
      }
    }

    return currentAssets
  }

  return extract([], node)
}

class Extractor<INode = any>
  extends t.AExtractor<INode>
  implements ADisposable
{
  #fs: ReturnType<typeof createFileSystem> | undefined
  #root: ARoot | Record<string, any> | undefined
  #isDisposed = false
  disposables: ADisposable[] = [];

  [Symbol.iterator]() {
    return this.#root?.[Symbol.iterator]()
  }

  [Symbol.for('nodejs.util.inspect.custom')]() {
    return {
      hasAccumulator: !!this.#root,
    }
  }

  constructor(root?: ARoot | Record<string, any>) {
    super()
    if (root) this.#root = root
  }

  get fs() {
    return this.#fs
  }

  dispose(): void {
    if (this.isDisposed()) this.#isDisposed = true
    if (this.#root) {
      Object.keys(this.#root).forEach((key) => delete this.#root?.[key])
    }
    disposeAll(this.disposables)
  }

  extract<O = any>(value: O, finalizer?: ExtractCallback<INode>): Asset[]
  extract<O = any>(finalizer?: ExtractCallback<INode>): Asset[]
  extract<O = any>(
    valueOrFinalizer?: ExtractCallback<INode> | O,
    finalizerFunction?: ExtractCallback<INode>,
  ) {
    let results = [] as Asset[]
    let value: any

    const finalizer = (
      typeof valueOrFinalizer === 'function'
        ? valueOrFinalizer
        : finalizerFunction
    ) as ExtractCallback<INode>

    if (typeof valueOrFinalizer === 'function') {
      value = this.#root
    } else {
      value = valueOrFinalizer
    }

    if (value) {
      if (value instanceof ARoot) {
        for (const [key, value] of this) {
          const result = defaultExtractor(value, finalizer)
          if (result) results.push(...result)
        }
      } else {
        for (const val of Object.values(value)) {
          const result = defaultExtractor(val, finalizer)
          if (result) results.push(...result)
        }
      }
    }

    return results
  }

  isDisposed() {
    return this.#isDisposed
  }

  register<T extends ADisposable>(value: T): T {
    if (this.isDisposed()) value.dispose()
    else this.disposables.push(value)
    return value
  }

  use(value: Parameters<t.AExtractor<any>['use']>[0]) {
    if (value instanceof ARoot) {
      this.#root = value
    } else if (value instanceof t.AStructure) {
      //
    } else if (value && typeof value === 'object') {
      if ('readFile' in value || 'writeFile' in value) {
        this.#fs = createFileSystem(value)
      } else {
        // Assuming it is the root object
        this.#root = value
      }
    }
    return this
  }
}

export default Extractor

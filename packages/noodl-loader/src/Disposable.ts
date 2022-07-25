export function disposeAll(disposables: ADisposable[]) {
  while (disposables.length) disposables.pop()?.dispose()
}

export abstract class ADisposable {
  disposables: ADisposable[] = []
  abstract dispose(): any
  abstract isDisposed(): boolean
  abstract register<T extends ADisposable>(value: T): any
}

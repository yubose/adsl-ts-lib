import curry from 'lodash/curry'

const resourceFactory = (function () {
  const createResource = <
    C,
    Opts extends Record<string, any>,
    T extends string,
  >(
    Constructor: new (options: Opts & { type: T }) => C,
  ) =>
    curry<T, ((result: C) => void) | null | undefined, Opts, C>(
      (
        resourceType: T,
        callback: ((result: C) => void) | null | undefined,
        options: Opts,
      ) => {
        const record = new Constructor({
          type: resourceType,
          ...options,
        })
        callback?.(record)
        return record
      },
    )

  return {
    createResource,
  }
})()

export default resourceFactory

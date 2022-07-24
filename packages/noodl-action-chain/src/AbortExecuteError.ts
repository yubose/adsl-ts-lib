class AbortExecuteError extends Error {
  override name: string = 'AbortExecuteError'

  constructor(message: string) {
    super(message)
  }
}

export default AbortExecuteError

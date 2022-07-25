import findWindow from './findWindow'

function findWindowDocument(
  cb: (
    doc: Document | HTMLIFrameElement['contentDocument'],
  ) => boolean | null | undefined,
) {
  let win: Window | null | undefined
  win = findWindow((w) => {
    try {
      return cb(w?.['contentDocument'] || w?.document)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      // Allow the loop to continue if it is accessing an outside origin window
      if (err.name === 'SecurityError' || (err as any).code === 18) {
      } else {
        console.error(`[${err.name}]: ${err.message}`)
      }
      return false
    }
  })
  return (win?.['contentDocument'] || win?.document) as
    | Document
    | HTMLIFrameElement['contentDocument']
}

export default findWindowDocument

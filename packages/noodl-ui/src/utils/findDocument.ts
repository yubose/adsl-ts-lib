import findWindowDocument from './findWindowDocument'

export default function findDocument(cb: (doc: Document | null) => boolean) {
  return findWindowDocument((doc) => {
    if (!doc) return true
    if (cb(doc)) return false
    return false
  })
}

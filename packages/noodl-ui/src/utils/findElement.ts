import findWindowDocument from './findWindowDocument'

export interface Callback {
  (doc: Document | null | undefined):
    | HTMLCollection
    | HTMLElement
    | NodeListOf<HTMLElement>
    | NodeList
    | null
    | undefined
}

function findElement<Cb extends Callback>(cb: Cb) {
  const doc = findWindowDocument((doc) => !!cb(doc))
  const result = cb(doc || document)
  if (result) {
    if (result instanceof NodeList || result instanceof HTMLCollection) {
      if (result.length > 1) {
        const nodes = [] as HTMLElement[]
        for (const node of result) nodes.push(node as HTMLElement)
        return nodes
      } else {
        return result.item(0) as HTMLElement
      }
    }
  }
  return result || null
}

export default findElement

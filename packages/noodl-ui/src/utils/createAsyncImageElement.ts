/**
 * Creates an image element that loads asynchronously
 * @param { HTMLElement } container - Element to attach the image in
 */
function createAsyncImageElement(
  container = document.body,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const node = new Image()

    node.onload = () => resolve(node)
    node.onerror = reject

    try {
      if (!container) resolve(node)
      else container.appendChild(node)
    } catch (error) {
      console.error(error)
      reject(error)
    } finally {
      node.dispatchEvent(new Event('load'))
    }
  })
}

export default createAsyncImageElement

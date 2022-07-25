import * as u from '@jsmanifest/utils'

function createTextNode(
  content: string | number,
  options?: Record<string, any>,
) {
  const div = document.createElement('div')
  const textNode = document.createTextNode(String(content))
  if (options) {
    u.entries(options).forEach(([key, value]) => {
      if (key === 'style') {
        u.isObj(value) &&
          u.entries(value).forEach(([styleKey, styleValue]) => {
            div.style[styleKey] = styleValue
          })
      } else if (key === 'classList') {
        u.array(value).forEach((className) => {
          className && div.classList.add(className)
        })
      } else div.setAttribute(key, value)
    })
  }
  div.appendChild(textNode)
  return div
}

export default createTextNode

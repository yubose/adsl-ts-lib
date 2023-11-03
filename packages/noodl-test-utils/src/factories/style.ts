import type { StyleTextAlignObject } from 'noodl-types'

const styleFactory = (function () {
  function borderStyle(value: string | number) {
    return { style: String(value) }
  }

  function textAlignObject<
    X extends StyleTextAlignObject['x'] = StyleTextAlignObject['x'],
    Y extends StyleTextAlignObject['y'] = StyleTextAlignObject['y'],
  >(x: X, y: Y) {
    return { x, y } as { x: X; y: Y }
  }

  return {
    borderStyle,
    textAlignObject,
  }
})()

export default styleFactory

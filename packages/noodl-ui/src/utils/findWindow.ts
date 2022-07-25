function findWindow(
  cb: (
    win: Window | HTMLIFrameElement['contentWindow'],
  ) => boolean | null | undefined,
) {
  if (typeof window !== 'undefined') {
    if (window.length) {
      let index = 0
      while (index < window.length) {
        if (cb(window[index])) return window[index]
        index++
      }
    } else {
      if (cb(window)) return window
    }
  }
  return null
}

export default findWindow

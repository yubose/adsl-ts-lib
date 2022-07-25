const setErrCode = (error: Error, value: any) => (error['code'] = value)

/**
 * @param fileUrlOrPath
 */
// From: <https://github.com/nodejs/node/blob/fcf8ba4/lib/internal/url.js#L1501>
export function isUrl(fileUrlOrPath: any): fileUrlOrPath is URL {
  return (
    fileUrlOrPath !== null &&
    typeof fileUrlOrPath === 'object' &&
    fileUrlOrPath.href &&
    fileUrlOrPath.origin
  )
}

function getPathFromURLPosix(url: URL) {
  if (url.hostname !== '') {
    const error = new TypeError(
      'File URL host must be "localhost" or empty on darwin',
    )
    setErrCode(error, 'ERR_INVALID_FILE_URL_HOST')
    throw error
  }

  let pathname = url.pathname
  let index = -1

  while (++index < pathname.length) {
    if (
      pathname.charCodeAt(index) === 37 /* `%` */ &&
      pathname.charCodeAt(index + 1) === 50 /* `2` */
    ) {
      const third = pathname.charCodeAt(index + 2)
      if (third === 70 /* `F` */ || third === 102 /* `f` */) {
        const error = new TypeError(
          'File URL path must not include encoded / characters',
        )
        setErrCode(error, 'ERR_INVALID_FILE_URL_PATH')
        throw error
      }
    }
  }

  return decodeURIComponent(pathname)
}

// See: <https://github.com/nodejs/node/blob/fcf8ba4/lib/internal/url.js>

export function urlToPath(path: URL | string) {
  if (typeof path === 'string') {
    path = new URL(path)
  } else if (!isUrl(path)) {
    const error = new TypeError(
      'The "path" argument must be of type string or an instance of URL. Received `' +
        path +
        '`',
    )
    setErrCode(error, 'ERR_INVALID_ARG_TYPE')
    throw error
  }

  if (path.protocol !== 'file:') {
    const error = new TypeError('The URL must be of scheme file')
    setErrCode(error, 'ERR_INVALID_URL_SCHEME')
    throw error
  }

  return getPathFromURLPosix(path)
}

export const extStrings = {
  document: ['doc', 'docx', 'json', 'pdf'],
  image: ['bmp', 'gif', 'jpg', 'jpeg', 'tif', 'tiff', 'png', 'webp'],
  page: ['yml'],
  script: ['js'],
  video: ['avi', 'flac', 'flav', 'mpg', 'mpeg', 'mkv', 'mp4', 'ogg', 'wmv'],
} as const

const image = new RegExp(`\\.(${extStrings.image.join('|')})$`)
const video = new RegExp(`\\.(${extStrings.video.join('|')})$`)
const script = new RegExp(`\\.(js)$`)
const text = new RegExp(`\\.(css|html|txt)$`)
const file = new RegExp(
  `\\.(${Object.values(extStrings)
    .reduce((acc, strs) => acc.concat(strs as any), [])
    .join('|')})$`,
)
const url = new RegExp(
  '(https?://(?:www.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9].[^s]{2,}|www.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9].[^s]{2,}|https?://(?:www.|(?!www))[a-zA-Z0-9]+.[^s]{2,}|www.[a-zA-Z0-9]+.[^s]{2,})',
)

export default {
  localAddress: /(127.0.0.1|localhost)/,
  reference: {
    at: {
      apply: /[a-zA-Z0-9]+@$/,
    },
    dot: {
      single: {
        root: /(^\.[A-Z])/,
        localRoot: /^([\s]*\.[a-z])/,
      },
      double: {
        root: /(^\.\.[A-Z])/,
        localRoot: /^([\s]*\.\.[a-z])/,
      },
    },
    eq: {
      eval: /^[\s]*=([a-zA-Z]+|\.{1,2}[a-zA-Z]+)/,
    },
    underline: {
      traverse: /([.][_]+[a-zA-Z])/,
    },
  },
  file,
  image,
  script,
  text,
  video,
  url,
}

import y from 'yaml'

export type ParseOptions = y.DocumentOptions | y.ParseOptions | y.SchemaOptions

const defaultParseOptions: ParseOptions = {
  logLevel: 'debug',
  keepSourceTokens: true,
  prettyErrors: true,
}

export const isScalar = y.isScalar
export const isPair = y.isPair
export const isMap = y.isMap
export const isSeq = y.isSeq

export function toDoc(yml: string, opts?: ParseOptions) {
  const parseOptions: typeof opts = { ...defaultParseOptions, ...opts }
  if (typeof yml === 'string') return y.parseDocument(yml, parseOptions)
  if (yml !== null && typeof yml === 'object') {
    return new y.Document(yml, parseOptions)
  }
}

export function toYml(
  ymlOrDocOrJson:
    | any[]
    | Record<string, any>
    | y.Document
    | y.Document.Parsed
    | string,
  opts?: ParseOptions,
) {
  if (typeof ymlOrDocOrJson === 'string') return ymlOrDocOrJson
  if (ymlOrDocOrJson !== null) {
    return y.stringify(ymlOrDocOrJson, {
      ...defaultParseOptions,
      ...opts,
    })
  }
  return ''
}

export function toJson(
  ymlOrDoc:
    | any[]
    | Record<string, any>
    | y.Document
    | y.Document.Parsed
    | string,
  opts?: ParseOptions,
) {
  if (y.isDocument(ymlOrDoc)) return ymlOrDoc.toJSON()
  if (typeof ymlOrDoc === 'string') {
    return y.parse(ymlOrDoc, { ...defaultParseOptions, ...opts })
  }
  return ymlOrDoc
}

export const visit = y.visit
export const visitAsync = y.visitAsync

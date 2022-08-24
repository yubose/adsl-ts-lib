import y from 'yaml'
import { is } from 'noodl-core'

type SourceToken<S extends string = string> = Omit<
  y.CST.SourceToken,
  S | 'type'
>

type LazySourceToken<S extends string = string> = Partial<SourceToken<S>>

export function getLexTokens(ymlOrLexer: y.Lexer | string, yml?: string) {
  return is.str(ymlOrLexer)
    ? new y.Lexer().lex(ymlOrLexer)
    : ymlOrLexer.lex(yml as string)
}

export function getCstTokens(
  sourceOrParser: y.Parser | string,
  source?: string,
) {
  return is.str(sourceOrParser)
    ? new y.Parser().parse(sourceOrParser)
    : sourceOrParser.parse(source as string)
}

export function getCstDoc(
  composerOrTokens: ReturnType<typeof getCstTokens> | y.Composer,
  tokens?: ReturnType<typeof getCstTokens>,
) {
  return !(composerOrTokens instanceof y.Composer)
    ? new y.Composer().compose(tokens as ReturnType<typeof getCstTokens>, true)
    : (composerOrTokens as y.Composer).compose(
        tokens as ReturnType<typeof getCstTokens>,
        true,
      )
}

function createSourceTokenFn<Type extends y.CST.SourceToken['type']>(
  type: Type,
) {
  return function tokenFn(options?: LazySourceToken) {
    return {
      type,
      ...options,
    }
  }
}

export const anchor = createSourceTokenFn('anchor')
export const blockScalarHeader = createSourceTokenFn('block-scalar-header')
export const byteOrderMark = createSourceTokenFn('byte-order-mark')
export const comma = createSourceTokenFn('comma')
export const comment = createSourceTokenFn('comment')
export const directiveLine = createSourceTokenFn('directive-line')
export const docMode = createSourceTokenFn('doc-mode')
export const docStart = createSourceTokenFn('doc-start')
export const explicitKeyInd = createSourceTokenFn('explicit-key-ind')
export const flowErrorEnd = createSourceTokenFn('flow-error-end')
export const flowMapStart = createSourceTokenFn('flow-map-start')
export const flowMapEnd = createSourceTokenFn('flow-map-end')
export const flowSeqStart = createSourceTokenFn('flow-seq-start')
export const flowSeqEnd = createSourceTokenFn('flow-seq-end')
export const seqColon = createSourceTokenFn('seq-item-ind')

export function blockScalar(
  source: string,
  options?: Partial<Omit<y.CST.BlockScalar, 'type'>>,
) {
  return {
    type: 'block-scalar',
    source,
    ...options,
  } as y.CST.BlockScalar
}

export function blockMap(options?: Partial<Omit<y.CST.BlockMap, 'type'>>) {
  return {
    type: 'block-map',
    ...options,
  } as y.CST.BlockMap
}

export function blockSeq(options?: Partial<Omit<y.CST.BlockSequence, 'type'>>) {
  return {
    type: 'block-seq',
    ...options,
  } as y.CST.BlockSequence
}

export function document(
  options?: Partial<Omit<y.CST.Document, 'type'>>,
): y.CST.Document {
  return {
    type: 'document',
    start: [],
    ...options,
  } as y.CST.Document
}

export function documentEnd(
  options?: Partial<Omit<y.CST.DocumentEnd, 'type'>>,
): y.CST.DocumentEnd {
  return {
    type: 'doc-end',
    ...options,
  } as y.CST.DocumentEnd
}

export function directive(options: Partial<Omit<y.CST.Directive, 'type'>>) {
  return {
    type: 'directive',
    ...options,
  } as y.CST.Directive
}

export function error(
  messageOrOptions: Partial<Omit<y.CST.ErrorToken, 'type'>> | string,
) {
  let options
  let message = ''

  if (is.str(messageOrOptions)) {
    message = messageOrOptions
  } else if (is.obj(messageOrOptions)) {
    options = messageOrOptions
    message = messageOrOptions.message || ''
  }

  return {
    type: 'error',
    ...options,
    message,
  } as y.CST.ErrorToken
}

function createFlowScalar<Type extends y.CST.FlowScalar['type']>(type: Type) {
  return (options: Partial<Omit<y.CST.FlowScalar, 'type'>>) => {
    return {
      type,
      ...options,
    } as y.CST.FlowScalar
  }
}

export const flowAliasScalar = createFlowScalar('alias')
export const flowScalarScalar = createFlowScalar('scalar')
export const flowSingleQuotedScalar = createFlowScalar('single-quoted-scalar')
export const flowDoubleQuotedScalar = createFlowScalar('double-quoted-scalar')

export function mapColon(opts?: SourceToken<'source'>) {
  return {
    type: 'map-value-ind',
    source: ':',
    ...opts,
  } as y.CST.SourceToken
}

export function mapSeparator() {
  return [mapColon(), scalar(' '), newline()]
}

export function newline(numLinesOrOptions?: SourceToken<'source'> | number) {
  let options
  let newlines = '\n'

  if (is.num(numLinesOrOptions)) {
    newlines = '\n'.repeat(numLinesOrOptions)
  } else if (is.obj(numLinesOrOptions)) {
    options = numLinesOrOptions
  }
  return {
    type: 'newline',
    source: newlines,
    ...options,
  } as y.CST.SourceToken
}

export function scalar(
  valueOrOptions: SourceToken | unknown,
  options?: Partial<Omit<y.CST.SourceToken, 'type'>>,
) {
  if (is.obj(valueOrOptions)) {
    if (
      'indent' in valueOrOptions ||
      'offset' in valueOrOptions ||
      'source' in valueOrOptions
    ) {
      options = valueOrOptions
      valueOrOptions = options?.source
    }
  }
  return {
    type: 'scalar',
    source: valueOrOptions,
    ...options,
  } as y.CST.SourceToken & { type: 'scalar' }
}

export function space(numSpacesOroptions?: LazySourceToken<'source'> | number) {
  let options
  let source = ' '

  if (is.num(numSpacesOroptions)) {
    source = ' '.repeat(numSpacesOroptions)
  } else if (is.obj(numSpacesOroptions)) {
    options = numSpacesOroptions
  }
  return {
    type: 'space',
    source,
    ...options,
  } as y.CST.SourceToken & { type: 'space' }
}

// TODO - Unit test
export function tag(
  tagsOrOptions?: any[] | Partial<y.CST.SourceToken> | string,
) {
  let options
  let source

  if (is.str(tagsOrOptions)) {
    source = tagsOrOptions
  } else if (is.arr(tagsOrOptions)) {
    source = tagsOrOptions
  } else if (is.obj(tagsOrOptions)) {
    options = tagsOrOptions
    source = tagsOrOptions.source
  }
  return {
    type: 'tag',
    source,
    ...options,
  } as y.CST.SourceToken & { type: 'tag' }
}

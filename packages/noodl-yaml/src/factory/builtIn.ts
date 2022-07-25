import y from 'yaml'
import type { LiteralUnion } from 'type-fest'
import type { ReferenceString } from 'noodl-types'
import * as factory from './factory'

export type BuiltInFnObject<K extends string = string> = Record<
  `=.builtIn.${K}`,
  { dataIn: any; dataOut?: any }
>

class Builder {
  #composer = new y.Composer()
  #lexer = new y.Lexer()
  #parser = new y.Parser()
  #tokens: y.CST.Token[] = []

  add(token: y.CST.Token) {
    this.#tokens.push(token)
    return this
  }

  toJSON() {
    return this.#tokens
  }

  toString() {
    return JSON.stringify(this.toJSON())
  }
}

class BuiltInFnFactory extends Builder {
  create<K extends string>(
    key: string,
    dataIn: LiteralUnion<ReferenceString, string> | Record<string, any>,
    dataOut?: LiteralUnion<ReferenceString, string>,
  ) {
    const property = `=.builtIn.${key}`
    const token = factory.blockMap({
      items: [
        {
          start: [],
          key: factory.scalar(property),
          sep: [factory.mapColon(), factory.newline()],
        },
      ],
    })

    this.add(token)

    return token
  }
}

export default BuiltInFnFactory

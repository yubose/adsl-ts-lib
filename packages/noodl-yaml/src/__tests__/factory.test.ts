import { expect } from 'chai'
import sinon from 'sinon'
import y from 'yaml'
import { consts, fp, is as coreIs } from 'noodl-core'
import Root from '../DocRoot'
import createNode from '../utils/createNode'
import is from '../utils/is'
import DocDiagnostics from '../DocDiagnostics'
import DocVisitor from '../DocVisitor'
import { toYml } from '../utils/yaml'
import { factory } from '../factory'
import get from '../utils/get'
import has from '../utils/has'
import unwrap from '../utils/unwrap'
import * as asserters from '../asserters'
import * as com from '../compiler'
import * as c from '../constants'

let f: ReturnType<typeof factory>

beforeEach(() => {
  f = factory()
})

describe.only(`factory`, () => {
  describe(`emit`, () => {
    it(`should create an emit object node when no args`, () => {
      const node = f.createEmit()
      expect(node).to.be.instanceOf(y.YAMLMap)
      expect(node.has('emit')).to.be.true
      expect(has(node, 'emit.dataKey')).to.be.true
      expect(has(node, 'emit.actions')).to.be.true
      expect(get(node, 'emit.actions')).to.be.instanceOf(y.YAMLSeq)
    })

    describe(`when provided with two arguments`, () => {
      it(`should treat the first arg as dataKey`, () => {
        const node = f.createEmit('$var.key', [{ age: 30 }, { age: 29 }])
        expect(get(node, 'emit.dataKey', false)).to.eq('$var.key')
      })

      xit(`should treat the first arg as actions`, () => {
        //
      })
    })
  })

  describe(`if`, () => {
    it(`should create an if object node when no args`, () => {
      const node = f.createIf()
      expect(node).to.be.instanceOf(y.YAMLMap)
      expect(node.has('if')).to.be.true
      expect(node.get('if')).to.be.instanceOf(y.YAMLSeq)
      expect((node.get('if') as y.YAMLSeq).items).to.have.lengthOf(3)
    })
  })
})

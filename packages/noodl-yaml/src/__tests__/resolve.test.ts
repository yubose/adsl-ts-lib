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
import { resolve as _resolve } from './resolve'
import get from '../utils/get'
import has from '../utils/has'
import unwrap from '../utils/unwrap'
import * as asserters from '../asserters'
import * as com from '../compiler'
import * as c from '../constants'

const resolve = (value?: unknown, options?: any) => _resolve(value, options)

describe(`resolve`, () => {
  describe(`when given a string`, () => {
    it(`should return a normal string`, () => {
      expect(resolve('hello')).to.eq('hello')
    })

    describe(`references`, () => {
      const root = {
        SignIn: {
          avatar: 'myAvatar.png',
          components: [{ type: 'image', path: '..avatar' }],
        },
      }
      const page = 'SignIn'

      it(`should continue to resolve the local reference`, () => {
        expect(resolve('..avatar', { page, root })).to.eq('myAvatar.png')
      })

      it(`should continue to resolve the root reference`, () => {
        expect(resolve('.SignIn.avatar', { page, root })).to.eq('myAvatar.png')
      })

      xit(`should continue to resolve the local eval reference`, () => {
        //
      })

      xit(`should continue to resolve the root eval reference`, () => {
        //
      })

      xit(`should continue to resolve the await reference`, () => {
        //
      })

      xit(`should continue to resolve the traverse reference`, () => {
        //
      })
    })

    it(`should coerce 'true' and 'false'`, () => {
      expect(resolve('true')).to.be.true
      expect(resolve('false')).to.be.false
    })
  })

  it(`should return the number`, () => {
    expect(resolve(1)).to.eq(1)
  })

  it(`should return null and undefined`, () => {
    expect(resolve(null)).to.be.null
    expect(resolve()).to.be.undefined
    expect(resolve(undefined)).to.be.undefined
  })
})

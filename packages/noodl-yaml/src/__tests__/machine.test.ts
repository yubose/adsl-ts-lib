import { expect } from 'chai'
import sinon from 'sinon'
import y from 'yaml'
import { consts, fp, is as coreIs } from 'noodl-core'
import Root from '../DocRoot'
import createNode from '../utils/createNode'
import is from '../utils/is'
import { toYml } from '../utils/yaml'
import { factory } from '../factory'
import { ActionChain } from '../machine/action-chain'
import { createProducer, createEmitter } from '../machine'
import { resolve as _resolve } from './resolve'
import { Key } from '../machine/key'
import get from '../utils/get'
import has from '../utils/has'
import unwrap from '../utils/unwrap'
import * as c from '../constants'

const { Meta, MetaKind } = c

const produce = createProducer()
const emitter = createEmitter({ produce })

describe(`ActionChain`, () => {
  it(``, () => {
    const ac = new ActionChain()
    const cursor = new Cursor()
    const tape = new Tape(cursor)
  })
})

describe(`machine`, () => {
  describe(`emitter`, () => {
    describe(`when emitting await references`, () => {
      it.skip(`should use the second argument as the value and set it on the key in the first argument`, () => {
        const root = { SignIn: {} }
        emitter('.SignIn.food@', 'chicken', { root })
        expect(root)
          .to.have.property('SignIn')
          .to.have.property('food', 'chicken')
      })

      it.skip(`should resolve the reference and use it as the value`, () => {
        const root = { SignIn: { src: 'abc.gif', avatar: '..src' } }
        const emitted = emitter('.SignIn.url@', '.SignIn.avatar', { root })
        console.log({ root, emitted })
        expect(root.SignIn).to.have.property('url', 'abc.gif')
      })
    })
  })

  describe(`producer`, () => {
    xit(`[${Meta.Unknown}]`, () => {
      //
    })

    xit(`[${Meta.Base}]`, () => {
      //
    })

    describe(`when producting reference meta objects`, () => {
      it(`[${MetaKind.AwaitReference}] should create the meta object with the expected props`, () => {
        const key = 'avatar'
        const ref = '..avatar.src@'
        const meta = produce(ref, { meta: { key } })
        expect(meta).to.have.property('key', key)
        expect(meta).to.have.property('value', ref)
        expect(meta).to.have.property('local').to.be.true
        expect(meta).to.have.property('kind', MetaKind.AwaitReference)
        expect(meta).to.have.property('path').to.be.an('array').not.to.be.empty
        expect(meta)
          .to.have.property('path')
          .to.include.all.members(['avatar', 'src'])
        expect(meta).to.have.property('type', c.Meta.Reference)
      })

      it(`[${MetaKind.EvalReference}] should create the meta object with the expected props`, () => {
        const root = { SignIn: { avatar: { src: '' } } }
        const key = 'avatar'
        const ref = '=..avatar.src@'
        const meta = produce(ref, { meta: { key }, root })
        expect(meta).to.have.property('key', key)
        expect(meta).to.have.property('value', ref)
        expect(meta).to.have.deep.property('kind', [
          MetaKind.AwaitReference,
          MetaKind.EvalReference,
        ])
        expect(meta).to.have.property('local').to.be.true
        expect(meta).to.have.property('type', c.Meta.Reference)
      })

      it(`[${MetaKind.EvalReference}] should transform the value using the custom transformer and set it on the valueTransformed`, () => {
        const root = { SignIn: { avatar: { src: '' } } }
        const key = 'avatar'
        const ref = '=..avatar.src@'
        const valueTransformed = { fruits: [] }
        const spy = sinon.spy(() => valueTransformed)
        const meta = produce(ref, { meta: { key }, root, transform: spy })
        expect(spy).to.be.calledOnce
        expect(spy).to.be.calledWith(meta)
        expect(meta).to.have.property('valueTransformed', valueTransformed)
      })

      it(`[${MetaKind.MergeReference}] should create the meta object with the expected props`, () => {
        const root = { SignIn: { avatar: { src: '' } } }
        const key = 'avatar'
        const ref = '..avatar.src'
        const valueTransformed = { fruits: [] }
        const spy = sinon.spy(() => valueTransformed)
        const meta = produce(ref, { meta: { key }, root, transform: spy })
        expect(meta).to.have.property('kind', c.MetaKind.MergeReference)
        expect(meta).to.have.property('local').to.be.true
        expect(meta).to.have.property('value', ref)
        expect(meta).to.have.property('type', c.Meta.Reference)
      })

      it(`[${MetaKind.TildeReference}] should create the meta object with the expected props`, () => {
        const ref = '~/abc.png'
        const meta = produce(ref)
        expect(meta).to.have.property('kind', c.MetaKind.TildeReference)
        expect(meta).to.have.property('value', ref)
        expect(meta).to.have.property('type', c.Meta.Reference)
        expect(meta).to.have.property('pathname', 'abc.png')
      })

      it(`[${MetaKind.TraverseReference}] should create the meta object with the expected props`, () => {
        const root = {
          SignIn: {
            components: [
              {
                type: 'scrollView',
                avatar: 'hello.gif',
                children: [
                  {
                    type: 'list',
                    children: [
                      {
                        type: 'listItem',
                        children: [{ type: 'image', path: '___.avatar' }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        } as const
        const ref =
          root.SignIn.components[0].children[0].children[0].children[0].path
        const meta = produce(ref)
        expect(meta).to.have.property('kind', c.MetaKind.TraverseReference)
        expect(meta).to.have.property('value', ref)
        expect(meta).to.have.property('type', c.Meta.Reference)
        expect(meta).to.have.property('depth').to.be.a('number').to.eq(3)
        expect(meta).to.have.property('key').to.be.eq('avatar')
      })
    })
  })
})

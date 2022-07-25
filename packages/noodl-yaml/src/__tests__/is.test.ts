import { expect } from 'chai'
import * as nt from 'noodl-types'
import y from 'yaml'
import * as yu from 'yaml/util'
import DocRoot from '../DocRoot'
import is from '../utils/is'

const createScalar = (v?: any) => new y.Scalar(v)

describe(`is`, () => {
  nt.componentTypes.forEach((type) => {
    it(`[${type}] should return true`, () => {
      expect(is[type](new y.Document({ type, text: 'Hello!' }).contents as any))
        .to.be.true
      expect(
        is[type](
          new y.Document({ type: `${type}f`, text: 'Hello!' }).contents as any,
        ),
      ).to.be.false
    })
  })

  it(`[builtInFn] should return true`, () => {
    const doc = new y.Document({
      hi: {
        '=.builtIn.object.setProperty': { dataIn: { object: {}, key: 'fsfa' } },
      },
      hi2: {
        '=.built.object.setProperty': { dataIn: { object: {}, key: 'fsfa' } },
      },
    })
    expect(is.builtInFn(doc.get('hi'))).to.be.true
    expect(is.builtInFn(doc.get('hi2'))).to.be.false
  })

  it(`[equalTo] should return true`, () => {
    const doc = new y.Document({ hello1: {}, hello2: { hello: '' } })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.false
  })

  it(`[equalTo] should return true`, () => {
    const doc = new y.Document({ hello1: {}, hello2: {} })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.true
  })

  it(`[equalTo] should return true`, () => {
    const doc = new y.Document({
      hello1: { apple: true },
      hello2: { apple: true },
    })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.true
  })

  it(`[equalTo] should return false`, () => {
    const doc = new y.Document({
      hello1: { apple: true },
      hello2: { apple: false },
    })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.false
  })

  it(`[equalTo] should return false`, () => {
    const doc = new y.Document({
      hello1: { apple: true, apple1: false },
      hello2: { apple: true },
    })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.false
  })

  it(`[equalTo] should return true`, () => {
    const doc = new y.Document({
      hello1: {},
      hello2: [{}],
    })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.false
  })

  it(`[equalTo] should return false`, () => {
    const doc = new y.Document({
      hello1: [],
      hello2: [{}],
    })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.false
  })

  it(`[equalTo] should return true`, () => {
    const doc = new y.Document({
      hello1: [{}],
      hello2: [{}],
    })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.true
  })

  it(`[equalTo] should return false`, () => {
    const doc = new y.Document({
      hello1: [{}],
      hello2: [{ apple: '' }],
    })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.false
  })

  it(`[equalTo] should return true`, () => {
    const doc = new y.Document({
      hello1: [{ apple: '' }],
      hello2: [{ apple: '' }],
    })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.true
  })

  it(`[equalTo] should return false`, () => {
    const doc = new y.Document({
      hello1: [{ apple: '' }],
      hello2: [{ apple: ' ' }],
    })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.false
  })

  it(`[equalTo] should return true`, () => {
    const doc = new y.Document({
      hello1: [{ apple: ' ' }],
      hello2: [{ apple: ' ' }],
    })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.true
  })

  it(`[equalTo] should return true`, () => {
    const doc = new y.Document({
      hello1: [{ apple: createScalar(' ') }],
      hello2: [{ apple: ' ' }],
    })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.true
  })

  it(`[equalTo] should return true`, () => {
    const doc = new y.Document({
      hello1: [{ apple: createScalar(111) }],
      hello2: [{ apple: 111 }],
    })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.true
  })

  it(`[equalTo] should return false`, () => {
    const doc = new y.Document({
      hello1: [{ apple: [1, 2] }],
      hello2: [{ apple: [2, 1] }],
    })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.false
  })

  it(`[equalTo] should return true`, () => {
    const doc = new y.Document({
      hello1: [{ apple: [2, 1] }],
      hello2: [{ apple: [2, 1] }],
    })
    const hello1 = doc.get('hello1')
    const hello2 = doc.get('hello2')
    expect(is.equalTo(hello1, hello2)).to.be.true
  })

  it(`[sameNodeType] should return true`, () => {
    expect(is.sameNodeType(createScalar(), createScalar())).to.be.true
    expect(is.sameNodeType(new y.YAMLMap(), new y.YAMLMap())).to.be.true
    expect(is.sameNodeType(new y.YAMLSeq(), new y.YAMLSeq())).to.be.true
    expect(is.sameNodeType(new y.Pair('1'), new y.Pair('1'))).to.be.true
    expect(is.sameNodeType(new y.Pair('1'), createScalar())).to.be.false
    expect(is.sameNodeType(new y.YAMLMap(), createScalar())).to.be.false
  })

  it(`[root] should return true`, () => {
    expect(is.root(new DocRoot())).to.be.true
  })
})

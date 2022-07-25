import { expect } from 'chai'
import y from 'yaml'
import Root from '../DocRoot'
import createNode from '../utils/createNode'

let root: Root

beforeEach(() => {
  root = new Root()
  root.set('Topo', {
    formData: {
      password: '123',
      email: 'pfft@gmail.com',
      currentIcon: '..icon',
      gender: 'Male',
    },
    icon: 'arrow.svg',
  })
  root.set('SignIn', {
    email: 'lopez@yahoo.com',
    components: [
      { type: 'button', text: '..greeting' },
      {
        type: 'view',
        children: [
          { type: 'label', text: '.SignIn.email' },
          { type: 'textField', dataKey: 'SignIn.email' },
        ],
      },
    ],
  })
})

describe(`DocRoot`, () => {
  it(`[set] should set keys as strings when given a node`, () => {
    const CerealPage = createNode({})
    const key = createNode('Cereal')
    root.set(key, CerealPage)
    expect(root.value.has('Cereal')).to.be.true
  })

  it(`[set] should parse string values to doc`, () => {
    root.set('Cereal', 'SignIn')
    expect(root.value.get('Cereal')).to.be.instanceOf(y.Document)
  })

  it(`[set] should parse object literal values to doc`, () => {
    root.set('Cereal', { SignIn: { greeting: 'hello' } })
    expect(root.value.get('Cereal')).to.be.instanceOf(y.Document)
  })

  it(`[set] should parse array values to doc`, () => {
    root.set('Cereal', [{ SignIn: { greeting: 'hello' } }])
    expect(root.value.get('Cereal')).to.be.instanceOf(y.Document)
  })

  it(`[set] should parse boolean values to doc`, () => {
    root.set('Cereal', false)
    expect(root.value.get('Cereal')).to.be.instanceOf(y.Document)
  })

  it(`[has] should work with Scalar nodes`, () => {
    root.set('Cereal', createNode({}))
    expect(root.has('Cereal')).to.be.true
    expect(root.has(new y.Scalar('Cereal'))).to.be.true
  })

  it(`[remove] should work with Scalar nodes`, () => {
    root.set('Cereal', createNode({}))
    expect(root.has('Cereal')).to.be.true
    root.remove(new y.Scalar('Cereal'))
    expect(root.has(new y.Scalar('Cereal'))).to.be.false
    expect(root.has('Cereal')).to.be.false
  })
})

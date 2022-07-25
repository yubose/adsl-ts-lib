import { expect } from 'chai'
import merge from '../transformers/merge'

const iteratorVar = 'itemObject'

beforeEach(() => {
  //
})

describe(`merge`, () => {
  it(`should not return null if given a null value to merge`, () => {
    const obj = {}
    expect(merge(obj, null)).not.to.be.null
    expect(merge(obj, undefined)).not.to.be.null
  })

  it(`should not return null if given an unresolvable reference to merge`, () => {
    const obj = { fruits: 'apple', path: 'abc.png' }
    expect(merge(obj, '.SignIn')).not.to.be.null
    expect(merge(obj, '..SignIn')).not.to.be.null
    expect(merge(obj, '=.SignIn')).not.to.be.null
    expect(merge(obj, '..a')).not.to.be.null
    expect(merge(obj, '.SignIn.a')).not.to.be.null
    expect(merge(obj, '=.')).not.to.be.null
    expect(merge(obj, '=.builtIn.string.concat')).not.to.be.null
  })

  it(`should return the original value if value to merge is incompatible or nullish or an unresolvable reference`, () => {
    const obj = { fruits: 'apple', path: 'abc.png' }
    expect(merge(obj, undefined)).to.eq(obj)
    expect(merge(obj, null)).to.eq(obj)
    expect(merge(obj, '')).to.eq(obj)
    expect(merge(obj, false)).to.eq(obj)
    expect(merge(obj, '.SignIn')).to.eq(obj)
    expect(merge(obj, '..a')).to.eq(obj)
    expect(merge(obj, '=..a')).to.eq(obj)
    expect(merge(obj, '=.SignIn')).to.eq(obj)
  })

  it(`should return the result of the resolved reference if node is a nullish/empty value`, () => {
    const obj = { fruits: 'apple', path: 'abc.png' }
    expect(merge(null, '.SignIn', { root: { SignIn: obj } })).to.deep.eq(obj)
    expect(
      merge(null, '..fruits', { root: { SignIn: obj }, rootKey: 'SignIn' }),
    ).to.eq('apple')
  })

  describe(`when merging values using iteratorVar (listObject references)`, () => {
    it(`should merge entire dataObject if iteratorVar references the entire object`, () => {
      const obj = { fruits: 'apple', path: 'abc.png' }
      const dataObject = { apple: 'yes' }
      expect(merge(obj, iteratorVar, { dataObject, iteratorVar })).to.deep.eq({
        fruits: 'apple',
        path: 'abc.png',
        apple: 'yes',
      })
    })

    it(`should merge the value at path of dataObject if iteratorVar references it`, () => {
      const obj = { fruits: 'apple', path: 'abc.png' }
      const dataObject = { apple: { soda: 'yes' } }
      expect(
        merge(obj, `${iteratorVar}.apple`, { dataObject, iteratorVar }),
      ).to.deep.eq({
        fruits: 'apple',
        path: 'abc.png',
        soda: 'yes',
      })
    })
  })

  xit(`should merge object values from references`, () => {
    const obj = { fruits: 'apple', path: 'abc.png' }
    const root = { Topo: { fruits: ['banana'], Style: null } }
    expect(merge(obj, '.Topo', { root })).to.deep.eq({
      fruits: ['banana'],
      path: 'abc.png',
      Style: null,
    })
  })
})

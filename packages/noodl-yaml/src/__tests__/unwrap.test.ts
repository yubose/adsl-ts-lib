import { expect } from 'chai'
import y from 'yaml'
import unwrap from '../utils/unwrap'
import Root from '../DocRoot'

describe(`unwrap`, () => {
  it(`should unwrap value from Scalar`, () => {
    const node = new y.Scalar('hello')
    expect(unwrap(node)).to.eq('hello')
  })

  it(`should unwrap value from yaml Document`, () => {
    const doc = new y.Document({
      formData: {
        password: '123',
        email: 'pfft@gmail.com',
        currentIcon: '..icon',
      },
      icon: 'arrow.svg',
    })
    expect(unwrap(doc)).to.deep.eq(doc.contents)
  })

  it(`should unwrap value from DocRoot`, () => {
    const root = new Root()
    root.set(
      'Topo',
      new y.Document({
        formData: {
          password: '123',
          email: 'pfft@gmail.com',
          currentIcon: '..icon',
        },
        icon: 'arrow.svg',
      }),
    )
    expect(unwrap(root)).to.eq(root.value)
  })
})

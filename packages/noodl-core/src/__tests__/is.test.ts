import { expect } from 'chai'
import * as is from '../utils/is'
import { Diagnostics } from '../diagnostics'

let diagnostics: Diagnostics

beforeEach(() => {
  diagnostics = new Diagnostics()
})

describe(`is`, () => {
  it(`[diagnostic] should return false`, () => {
    expect(is.diagnostic({})).to.be.false
  })
})

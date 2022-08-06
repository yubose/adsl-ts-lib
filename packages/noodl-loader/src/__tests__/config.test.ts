import { expect } from 'chai'
import Config from '../config'

let config: Config

beforeEach(() => {
  config = new Config()
})

describe(`Config`, () => {
  it(`should format the timestamp to MMDDYY.am`, () => {
    expect(config.getTimestamp()).to.match(
      new RegExp(`[0-9]{5,6}\.[ampAMP]{0,2}`),
    )
  })
})

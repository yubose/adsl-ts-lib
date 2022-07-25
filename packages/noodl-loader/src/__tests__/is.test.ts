import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import * as is from '../utils/is'

describe(`is`, () => {
  describe(`file`, () => {
    const tests = {
      './fixtures/meetd2.yml': true,
      'fixtures/meetd2.yml': true,
      '/fixtures/meetd2.yml': true,
      'file:fixtures/meetd2.yml': true,
      'file://fixtures/meetd2.yml': true,
      '../fixtures/meetd2.yml': true,
      'http://../fixtures/meetd2.yml': false,
      'http://fixtures/meetd2.yml': false,
      'https://fixtures/meetd2.yml': false,
      'https://': false,
      'file://': true,
      'file:': true,
      file: false,
    }

    u.entries(tests).forEach(([str, expectedResult]) => {
      it(`should return ${expectedResult} for ${str}`, () => {
        const result = is.file(str)
        expect(result).to.eq(expectedResult)
      })
    })
  })

  describe(`url`, () => {
    const tests = {
      './fixtures/meetd2.yml': false,
      'fixtures/meetd2.yml': false,
      '/fixtures/meetd2.yml': false,
      'file:fixtures/meetd2.yml': false,
      'file://fixtures/meetd2.yml': false,
      '../fixtures/meetd2.yml': false,
      'http://../fixtures/meetd2.yml': true,
      'http://fixtures/meetd2.yml': true,
      'https://fixtures/meetd2.yml': true,
      'https://': false,
      'file://': false,
      'file:': false,
      file: false,
    }

    u.entries(tests).forEach(([str, expectedResult]) => {
      it(`should return ${expectedResult} for ${str}`, () => {
        const result = is.url(str)
        expect(result).to.eq(expectedResult)
      })
    })
  })
})

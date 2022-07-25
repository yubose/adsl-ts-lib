import { expect } from 'chai'
import * as n from '../utils/noodl'

describe(`utils`, () => {
  const iteratorVar = 'itemObject'

  for (const [dataKey, expectedResult] of [
    [iteratorVar, ''],
    [`${iteratorVar}.key`, 'key'],
    ['', ''],
    [`${iteratorVar}.${iteratorVar}`, iteratorVar],
  ]) {
    it(`[excludeIteratorVar] should return ${expectedResult} if given ${dataKey}`, () => {
      expect(n.excludeIteratorVar(iteratorVar, dataKey)).to.eq(expectedResult)
    })
  }
})

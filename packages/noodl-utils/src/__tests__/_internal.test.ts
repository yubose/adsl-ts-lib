import { expect } from 'chai'
import * as _internal from '../_internal'

describe('_internal', () => {
  describe('unwrapObj', () => {
    it('should return the data object', () => {
      const dataObject = { fruit: 'appple' }
      const obj = () => dataObject
      expect(_internal.unwrapObj(obj)).to.eq(dataObject)
    })

    it('should return the data objects', () => {
      const dataObject1 = { fruit: 'appple' }
      const dataObject2 = { fruit: 'orange' }
      const dataObject3 = { color: { red: 10 } }
      const dataObject4 = { fruit: 'banana' }
      const dataObjects = [dataObject1, dataObject2, dataObject3, dataObject4]
      ;[
        () => dataObject1,
        dataObject2,
        () => dataObject3,
        () => dataObject4,
      ].forEach((obj, index) => {
        expect(_internal.unwrapObj(obj)).to.eq(dataObjects[index])
      })
    })
  })
})

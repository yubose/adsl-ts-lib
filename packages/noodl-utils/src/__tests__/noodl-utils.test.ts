import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import * as n from '../index'

describe(u.yellow('createEmitDataKey'), () => {
  const dataObject = { key: 'gender', value: 'Female' }
  const pageObject = { genderInfo: dataObject }
  const root = { Global: {}, MeetingRoomCreate: pageObject }
  const orig = { var1: 'genderInfo', var2: 'genderInfo.key' }

  it('should attach the dataObjects from the paths', () => {
    const dataKey = n.createEmitDataKey(orig, [dataObject, pageObject, root])
    expect(dataKey).to.have.property('var1', dataObject)
    expect(dataKey).to.have.property('var2', 'gender')
  })

  it('should attach the dataObjects using a path', () => {
    const dataKey = n.createEmitDataKey(
      { var1: 'Global', var2: 'MeetingRoomCreate' },
      [dataObject, pageObject, root],
    )
    expect(dataKey).to.have.property('var1', root.Global)
    expect(dataKey).to.have.property('var2', root.MeetingRoomCreate)
  })

  it('should attach the dataObject using a string dataKey', () => {
    expect(
      n.createEmitDataKey('MeetingRoomCreate', [dataObject, pageObject, root]),
    ).to.eq(root.MeetingRoomCreate)
    expect(
      n.createEmitDataKey('genderInfo.value', [dataObject, pageObject, root]),
    ).to.eq('Female')
    expect(n.createEmitDataKey('genderInfo.value', pageObject)).to.eq('Female')
    expect(n.createEmitDataKey('key', dataObject)).to.eq('gender')
  })
})

describe(u.yellow('excludeIteratorVar'), () => {
  const iteratorVar = 'itemObject'
  const tests = {
    [iteratorVar]: ``,
    [`${iteratorVar}.`]: ``,
    [`${iteratorVar}.....`]: `....`,
    [`${iteratorVar}.formData.password`]: `formData.password`,
    [`.formData.password`]: `.formData.password`,
    [`formData.password`]: `formData.password`,
    [`${iteratorVar}formData.${iteratorVar}.password`]: `formData.password`,
    [`${iteratorVar}...formData.${iteratorVar}.password`]: `..formData.password`,
  } as const

  u.entries(tests).forEach(([testStr, expectedResult]) => {
    it(`should return ${u.white(expectedResult)} for ${testStr}`, () => {
      expect(n.excludeIteratorVar(testStr as string, iteratorVar)).to.eq(
        expectedResult,
      )
    })
  })
})

describe(u.yellow('findDataValue'), () => {
  const listObject = [
    { fruits: ['apple'], color: 'purple' },
    { fruits: ['banana'], color: 'red' },
  ]
  const pageObject = { hello: { name: 'Henry' }, listData: listObject }
  const root = { Bottle: pageObject, Global: { vertex: {} } }

  it('should be able to return the data object by using a page object', () => {
    expect(n.findDataValue(pageObject, 'hello.name')).to.eq('Henry')
  })

  it('should be able to return the data object by using a root object', () => {
    expect(n.findDataValue(root, 'Bottle')).to.eq(pageObject)
  })
})

describe(u.yellow('isRootDataKey'), () => {
  Object.entries({
    '..SignIn.formData': true,
    '.SignIn.formData': true,
    'SignIn.formData': true,
    ',SignIn.formData': false,
    'signIn.formData': false,
    sASKMSADSAD: false,
    '.signIn.formData': false,
    '..signIn.formData': false,
    '..,fsignIn.formData': false,
  }).forEach(([key, expectedResult]) => {
    it(`should return ${expectedResult} for "${key}"`, () => {
      expect(n.isRootDataKey(key)).to.be[expectedResult ? 'true' : 'false']
    })
  })
})

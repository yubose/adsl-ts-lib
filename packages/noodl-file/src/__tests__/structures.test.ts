import { expect } from 'chai'
import path from 'path'
import FileStructure from '../FileStructure'
import LinkStructure from '../LinkStructure'

describe(`structures`, () => {
  describe(`FileStructure`, () => {
    const tests = {
      'file:packages/noodl-app/package.json': {
        dir: 'file:packages/noodl-app',
        ext: 'json',
        filepath: path.join(__dirname, 'packages/noodl-app/package.json'),
        group: 'unknown',
        name: 'package',
        raw: 'file:packages/noodl-app/package.json',
        rootDir: [null],
      },
    }

    Object.entries(tests).forEach(([testStr, expectedResult]) => {
      it(`should return the right structure for ${testStr}`, () => {
        const structure = new FileStructure()
        expect(structure.createStructure(testStr)).to.deep.eq(expectedResult)
      })
    })
  })
})

import path from 'path'
import { expect } from 'chai'
import { getFileStructure, getLinkStructure } from 'noodl-file'
import nock from 'nock'
import sinon from 'sinon'

describe.skip(`utils`, () => {
  describe(`fileSystem`, () => {
    describe(`mapFilesToNoodlCollections`, () => {
      it.skip(`should map filepaths to noodl collections`, () => {
        const results = mapFilesToNoodlCollections(
          'admind3',
          path.join(process.cwd(), '../../generated/admind3'),
          {
            includeWithPages: ['MenuBar'],
          },
        )
      })
    })
  })

  describe(`getFileStructure`, () => {
    const filepath =
      '/Users/christ/ecos/aitmed/ecos/v1beta1/EcosAPI/ce-request.json'

    describe(filepath, () => {
      const result = getFileStructure(filepath)

      it(`should set the ext to .mk4`, () => {
        expect(result).to.have.property('ext', '.json')
      })

      it(`should set filename to ce-request`, () => {
        expect(result).to.have.property('filename', 'ce-request')
      })

      it(`should set filepath to ${filepath}`, () => {
        expect(result).to.have.property('filepath', filepath)
      })

      it(`should set dir to /Users/christ/ecos/aitmed/ecos/v1beta1/EcosAPI`, () => {
        expect(result).to.have.property(
          'dir',
          `/Users/christ/ecos/aitmed/ecos/v1beta1/EcosAPI`,
        )
      })

      it(`should set group to document`, () => {
        expect(result).to.have.property('group', 'document')
      })

      it(`should set the rootDir`, () => {
        expect(result).to.have.property('rootDir', '/')
      })
    })
  })

  describe(`getLinkStructure`, () => {
    const theDarkKnightMkv = 'http://www.google.com/movies/TheDarkKnight.mkv'

    describe(theDarkKnightMkv, () => {
      const result = getLinkStructure(theDarkKnightMkv)

      it(`should set the ext to .mk4`, () => {
        expect(result).to.have.property('ext', '.mkv')
      })

      it(`should set filename to TheDarkKnight`, () => {
        expect(result).to.have.property('filename', 'TheDarkKnight')
      })

      it(`should set isRemote to true`, () => {
        expect(result).to.have.property('isRemote')
        expect(result.isRemote).to.be.true
      })

      it(`should set url to ${theDarkKnightMkv}`, () => {
        expect(result).to.have.property('url', theDarkKnightMkv)
      })

      it(`should set group to video`, () => {
        expect(result).to.have.property('group', 'video')
      })
    })
  })

  describe(`loadFile`, () => {
    xit(``, () => {
      //
    })
  })
})

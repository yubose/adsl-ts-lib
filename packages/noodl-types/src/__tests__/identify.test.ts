import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import * as t from '..'

const label = (s: string) => u.italic(u.white(s))

describe(u.yellow('Identify'), () => {
  describe(label('actionChain'), () => {
    it(`should accept emit objects`, () => {
      expect(
        t.Identify.actionChain([
          { emit: { dataKey: { var1: 'itemObject' } }, actions: [] },
        ]),
      ).to.be.true
    })

    it(`should accept goto objects`, () => {
      expect(
        t.Identify.actionChain([
          { emit: { dataKey: { var1: 'itemObject' } }, actions: [] },
          { goto: 'PatientDashboard' },
          { toast: { message: 'Hello' } },
        ]),
      ).to.be.true
    })

    it(`should accept emit and goto`, () => {
      expect(
        t.Identify.actionChain([
          { emit: { dataKey: { var1: 'itemObject' } }, actions: [] },
          { goto: 'PatientDashboard' },
          { toast: { message: 'Hello' } },
        ]),
      ).to.be.true
    })
  })

  describe(label('ecosObj'), () => {
    describe(`note/pdf`, () => {
      it(`should return true for note/pdf docs`, () => {
        const ecosObj: t.EcosDocument<any> = {
          name: {
            title: `note title`,
            data: `note's contents`,
            type: 'application/json',
          },
          subtype: { mediaType: 1 },
          type: 1025,
        }
        expect(t.Identify.ecosObj.doc(ecosObj)).to.be.true
      })

      it(`should return false for docs that are not note/pdf docs`, () => {
        const ecosObj: t.EcosDocument<any> = {
          name: {
            title: `note title`,
            data: `note's contents`,
            type: 'text/plain',
          },
          subtype: { mediaType: 1 },
          type: 1025,
        }
        expect(t.Identify.ecosObj.doc(ecosObj)).to.be.true
        ecosObj.subtype && (ecosObj.subtype.mediaType = 2)
        ecosObj.name.type = 'application/json'
        expect(t.Identify.ecosObj.doc(ecosObj)).to.be.true
        ecosObj.name.type = 'text/html'
        expect(t.Identify.ecosObj.doc(ecosObj)).to.be.false
        ecosObj.name.type = 'text/markdown'
        expect(t.Identify.ecosObj.doc(ecosObj)).to.be.false
        ecosObj.name.type = 'text/javascript'
        expect(t.Identify.ecosObj.doc(ecosObj)).to.be.false
        ecosObj.name.type = 'image/png'
        expect(t.Identify.ecosObj.doc(ecosObj)).to.be.false
        ecosObj.name.type = 'image/jpg'
        expect(t.Identify.ecosObj.doc(ecosObj)).to.be.false
        ecosObj.name.type = 'video/mp4'
        expect(t.Identify.ecosObj.doc(ecosObj)).to.be.false
      })
    })
  })

  describe(label(`reference`), () => {
    const tests = {
      evolve: {
        '.builtIn.isAndroid': false,
        '..setAndroid': false,
        '=.Global.currentUser.vertex.sk': true,
        '..appLink.url@': false,
        '=.builtIn.string.equal': true,
      },
      local: {
        '=.SignIn.loginNewDevice.edgeAPI.store': false,
        '.Global.currentUser.dataCache.loadingDateTime@': false,
        '=.Global.currentUser.vertex.sk': false,
        '=..loginNewDevice.response.edge.deat.user_id': true,
        '=..rvCondition': true,
        '=.Global._nonce': false,
        '..formData.countryCode': true,
        '.formData.countryCode': false,
        '=.SignIn.formData.countryCode': false,
        '=..verificationCode.response.edge.deat.phone_number': true,
      },
      root: {
        '=.SignIn.loginNewDevice.edgeAPI.store': true,
        // '=.builtIn.math.random': true,
        '.Global.currentUser.dataCache.loadingDateTime@': true,
        '=.Global.currentUser.vertex.sk': true,
        '=..loginNewDevice.response.edge.deat.user_id': false,
        '=..rvCondition': false,
        '=.Global._nonce': true,
        '..formData.countryCode': false,
        '.formData.countryCode': false,
        '=.SignIn.formData.countryCode': true,
        '=..verificationCode.response.edge.deat.phone_number': false,
      },
      await: {
        '.builtIn.isAndroid': false,
        '..setAndroid': false,
        '=.Global.currentUser.vertex.sk': false,
        '.SignUp.formData.countryCode@': true,
        '.SignUp.formData.countryCode': false,
        '=.Global.currentUser.vertex.sk@': true,
      },
      traverse: {
        __message: false,
        '__.message': true,
        '_.message': true,
        '.message': false,
        message: false,
        // '=__.message': true,
        // '..__.message': true,
      },
      tilde: {
        __message: false,
        '_.message': false,
        '.message': false,
        message: false,
        '~/message': true,
        '~message': false,
        '~~/message': false,
        '/message': false,
      },
    }

    describe(`await references`, () => {
      u.entries(tests.await).forEach(([reference, expectedValue]) => {
        it(`should be ${expectedValue} for ${reference}`, () => {
          expect(t.Identify.awaitReference(reference)).to.be[
            String(expectedValue)
          ]
        })
      })
    })

    describe(`evolve references`, () => {
      u.entries(tests.evolve).forEach(([reference, expectedValue]) => {
        it(`should be ${expectedValue} for ${reference}`, () => {
          expect(t.Identify.evalReference(reference)).to.be[
            String(expectedValue)
          ]
        })
      })
    })

    describe(`local merge references`, () => {
      u.entries(tests.local).forEach(([reference, expectedValue]) => {
        it(`should be ${expectedValue} for ${reference}`, () => {
          expect(t.Identify.localReference(reference)).to.be[
            String(expectedValue)
          ]
        })
      })
    })

    describe(`root merge references`, () => {
      u.entries(tests.root).forEach(([reference, expectedValue]) => {
        it(`should be ${expectedValue} for ${reference}`, () => {
          expect(t.Identify.rootReference(reference)).to.be[
            String(expectedValue)
          ]
        })
      })
    })

    describe(`traverse references`, () => {
      u.entries(tests.traverse).forEach(([reference, expectedValue]) => {
        it(`should be ${expectedValue} for ${reference}`, () => {
          expect(t.Identify.traverseReference(reference)).to.be[
            String(expectedValue)
          ]
        })
      })
    })

    describe(`tilde references`, () => {
      u.entries(tests.tilde).forEach(([reference, expectedValue]) => {
        it(`should be ${expectedValue} for ${reference}`, () => {
          expect(t.Identify.tildeReference(reference)).to.be[
            String(expectedValue)
          ]
        })
      })
    })
  })
})

import { expect } from 'chai'
import sinon from 'sinon'
import y from 'yaml'
import { consts, fp, is as coreIs } from 'noodl-core'
import Root from '../DocRoot'
import createNode from '../utils/createNode'
import is from '../utils/is'
import DocDiagnostics from '../DocDiagnostics'
import DocVisitor from '../DocVisitor'
import { toYml } from '../utils/yaml'
import unwrap from '../utils/unwrap'
import * as asserters from '../asserters'
import * as com from '../compiler'
import * as c from '../constants'

const { DiagnosticCode } = consts

let docDiagnostics: DocDiagnostics
let docRoot: Root
let docVisitor: DocVisitor

beforeEach(() => {
  docRoot = new Root()
  docVisitor = new DocVisitor()
  docDiagnostics = new DocDiagnostics()
  docDiagnostics.use(docVisitor)
  docDiagnostics.use(docRoot)
})

function runAsserter(...name: (keyof typeof asserters)[]) {
  return docDiagnostics.run({ asserters: name.map((n) => asserters[n]) })
}

describe(`asserters`, () => {
  // it.only(``, () => {
  //   docRoot.set('Topo', {
  //     goto1: { goto: 'A@.#C' },
  //     goto2: { goto: '.@B#C' },
  //     goto3: { goto: 'A@B#.' },
  //     viewTag: 'helloTag',
  //     bob: { viewTag: 'sodaTag' },
  //     bob2: { popUpView: '.Topo.viewTag' },
  //     soda: 'noPopUpViewPointer',
  //     components: [
  //       { type: 'label', viewTag: '..viewTag' },
  //       { type: 'label', viewTag: '..bob.viewTag' },
  //       {
  //         type: 'image',
  //         path: 'abc.png',
  //         onClick: [{ actionType: 'popUp', viewTag: 'whatViewTag' }],
  //         onMouseOver: [{ actionType: 'popUp' }],
  //       },
  //     ],
  //   })
  //   docDiagnostics.mark('page', 'Topo')
  //   const results = docDiagnostics.run({
  //     asserters: [assertPopUpView, assertRef, assertGoto, assertViewTag],
  //   })
  // })

  describe(`assertBuiltIn`, () => {
    it(`should report if missing`, () => {
      docRoot.set('Topo', {
        '=.builtIn.string.equal': {
          dataIn: { string1: 'abc.png', string2: 'abc.png' },
          dataOut: 'Topo.isEqual',
        },
      })
      expect(
        docDiagnostics.codeExists(
          consts.DiagnosticCode.BUILTIN_FUNCTION_MISSING,
          runAsserter('assertBuiltIn'),
        ),
      ).to.be.true
    })

    it(`should report if not a function`, () => {
      docRoot.set('Topo', {
        '=.builtIn.string.equal': {
          dataIn: { string1: 'abc.png', string2: 'abc.png' },
          dataOut: 'Topo.isEqual',
        },
      })
      expect(
        docDiagnostics.codeExists(
          consts.DiagnosticCode.BUILTIN_FUNCTION_NOT_A_FUNCTION,
          docDiagnostics.run({
            asserters: asserters.assertBuiltIn,
            builtIn: {
              string: { equal: 'hello' as any },
            },
          }),
        ),
      ).to.be.true
    })

    it(`should call builtIn functions`, () => {
      docRoot.set('Topo', {
        '=.builtIn.string.equal': {
          dataIn: { string1: 'abc.png', string2: 'abc.png' },
          dataOut: 'Topo.isEqual',
        },
      })
      const spy = sinon.spy()
      docDiagnostics.run({
        asserters: asserters.assertBuiltIn,
        builtIn: { string: { equal: spy } },
      })
      expect(spy).to.be.calledOnce
    })

    it(`should set the result as the value to the path dataOut is pointing to`, () => {
      docRoot.set('Topo', {
        components: [
          {
            type: 'image',
            path: 'abc.png',
            onClick: [
              {
                actionType: 'evalObject',
                object: [
                  {
                    '=.builtIn.string.equal': {
                      dataIn: { string1: 'abc.png', string2: 'abc.png' },
                      dataOut: 'Topo.isEqual.bob',
                    },
                  },
                ],
              },
            ],
          },
        ],
      })
      docDiagnostics.run({
        asserters: asserters.assertBuiltIn,
        builtIn: {
          string: {
            equal: (dataIn) => dataIn.get('string1') === dataIn.get('string2'),
          },
        },
      })
      expect(unwrap(docRoot.get('Topo.isEqual.bob'))).to.eq(true)
      docRoot
        .get('Topo')
        .setIn([
          'components',
          0,
          'onClick',
          0,
          '=.builtIn.string.equal',
          'dataOut',
          'isEqual.bob',
        ])
      docDiagnostics.run({
        asserters: asserters.assertBuiltIn,
        builtIn: {
          string: {
            equal: () => 'soda',
          },
        },
      })
      expect(unwrap(docRoot.get('Topo.isEqual.bob'))).to.eq('soda')
    })
  })

  describe(`assertGoto`, () => {
    it(`should generate a report if page is not included in cadlEndpoint`, () => {
      docRoot.set('Topo', { goto: 'SignIn' })
      expect(docDiagnostics.markers.pages).not.to.include('SignIn')
      expect(
        docDiagnostics.codeExists(
          DiagnosticCode.GOTO_PAGE_MISSING_FROM_APP_CONFIG,
          runAsserter('assertGoto'),
        ),
      ).to.be.true
    })

    it(`should report if value is empty`, () => {
      docRoot.set('Topo', { goto: '' })
      expect(
        docDiagnostics.codeExists(
          DiagnosticCode.GOTO_PAGE_EMPTY,
          runAsserter('assertGoto'),
        ),
      ).to.be.true
    })

    describe(`when the destination is a page component url`, () => {
      for (const [pageComponentUrl, code] of [
        ['A@.#C', DiagnosticCode.GOTO_PAGE_COMPONENT_URL_CURRENT_PAGE_INVALID],
        ['@B#C', DiagnosticCode.GOTO_PAGE_COMPONENT_URL_TARGET_PAGE_INVALID],
        ['A@B#.', DiagnosticCode.GOTO_PAGE_COMPONENT_URL_VIEW_TAG_INVALID],
      ] as const) {
        it(`should report if one or more pages is not a valid value`, () => {
          docRoot.set('Topo', { goto: pageComponentUrl })
          expect(docDiagnostics.codeExists(code, runAsserter('assertGoto'))).to
            .be.true
        })
      }
    })
  })

  describe(`assertRef`, () => {
    it(`should replace tilde references`, () => {
      docRoot.set('Topo', { formValues: '~/Topo' })
      docDiagnostics.mark('baseUrl', 'https://hello.com/')
      runAsserter('assertRef')
      expect(unwrap(docDiagnostics.root?.get('Topo.formValues'))).to.eq(
        'https://hello.com/Topo',
      )
    })

    it(`should update reference nodes that are resolvable`, () => {
      docRoot.set('Cereal', {
        profile: { user: { avatar: '.Cereal.realIcon' } },
        icon: '..realIcon',
        realIcon: 'you-found-me.png',
        components: [{ type: 'button', text: '..icon' }],
      })
      docRoot.set('Tower', {
        profile: '.Cereal.profile',
        props: { name: 'Bob', profile: '..profile' },
        components: [
          {
            type: 'view',
            children: [{ type: 'button', props: '.Tower.props' }],
          },
        ],
      })
      runAsserter('assertRef')
      const Cereal = docRoot.get('Cereal') as y.YAMLMap
      const Tower = docRoot.get('Tower') as y.YAMLMap
      expect(Cereal.getIn(fp.path('profile.user.avatar'))).to.eq(
        'you-found-me.png',
      )
      expect(Cereal.get('icon')).to.eq('you-found-me.png')
      expect(Cereal.getIn(fp.path('components.0.text'))).to.eq(
        'you-found-me.png',
      )
      expect(Tower.get('profile')).to.eq(Cereal.get('profile'))
      expect(Tower.getIn(fp.path('props.profile'))).to.eq(Cereal.get('profile'))
      expect(Tower.getIn(fp.path('components.0.children.0.props'))).to.eq(
        Tower.get('props'),
      )
    })

    it(`should add unresolvable references to diagnostics`, () => {
      const Resource = {
        user: '.Resource.formValues',
        formValues: '..currentFormValues',
        currentFormValues: '.Tiger.incorrect.Path.toFormValues',
      }
      const Tiger = {
        formData: { profile: '..profile' },
        profile: { user: '.Resource.user' },
        formValues: { firstName: 'Bob', lastName: 'Gonzalez' },
      }

      docRoot.set('Resource', Resource)
      docRoot.set('Tiger', Tiger)
      docRoot.set('A', { fs: 's' })

      docDiagnostics.mark('rootConfig', 'A')
      docDiagnostics.mark('appConfig', 'cadlEndpoint')
      docDiagnostics.mark('preload', 'BaseCSS')
      docDiagnostics.mark('preload', 'BasePage')
      docDiagnostics.mark('page', 'SignOut')

      docDiagnostics.root?.set('cadlEndpoint', {
        preload: ['BaseCSS'],
        page: ['SignIn', 'Dashboard', ''],
      })
    })

    it(`should generate a report if a root reference contains uppercase in the second level`, () => {
      docRoot.set('A', { C: { apple: true }, apple: '.A.C.apple' })
      expect(
        docDiagnostics.codeExists(
          DiagnosticCode.ROOT_REFERENCE_SECOND_LEVEL_KEY_UPPERCASE,
          runAsserter('assertRef'),
        ),
      ).to.be.true
    })

    // COMPONENT KEY BINDINGS
    for (const type of ['assertViewTag', 'assertPopUpView'] as const) {
      const key = type === 'assertPopUpView' ? 'popUpView' : 'viewTag'
      const label = key === 'popUpView' ? 'POPUP_VIEW' : 'VIEW_TAG'

      describe(type, () => {
        it(`should report if ${key} is invalid`, () => {
          docRoot.set('A', { C: { [key]: '.' } })
          expect(
            docDiagnostics.codeExists(
              DiagnosticCode[`${label}_INVALID`],
              runAsserter(type),
            ),
          ).to.be.true
        })

        it(`should report if the ${key} does not have a pointer to a component`, () => {
          docRoot.set('A', {
            C: { apple: 'greenAppleTag' },
            [key]: '.A.C.apple',
            components: [{ type: 'label', [key]: 'greenAppleTag' }],
          })
          expect(
            docDiagnostics.codeExists(
              DiagnosticCode[`${label}_MISSING_COMPONENT_POINTER`],
              runAsserter(type),
            ),
          ).to.be.false
          docRoot.set('A', {
            C: { apple: 'greenAppleTag' },
            [key]: '.A.C.apple',
            components: [{ type: 'label', [key]: 'green' }],
          })
          expect(
            docDiagnostics.codeExists(
              DiagnosticCode[`${label}_MISSING_COMPONENT_POINTER`],
              runAsserter(type),
            ),
          ).to.be.true
          docRoot.set('A', {
            C: { apple: 'greenAppleTag' },
            [key]: 'greenAppleTag',
            components: [{ type: 'label', [key]: 'green' }],
          })
          expect(
            docDiagnostics.codeExists(
              DiagnosticCode[`${label}_MISSING_COMPONENT_POINTER`],
              runAsserter(type),
            ),
          ).to.be.true
        })
      })
    }
  })
})

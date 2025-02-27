import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import m from 'noodl-test-utils'
import * as nt from 'noodl-types'
import sinon from 'sinon'
import * as u from '@jsmanifest/utils'
import { createOn, nui } from '../../utils/test-utils'

// @ts-ignore
let on: ReturnType<typeof createOn>

beforeEach(() => {
  on = createOn(nui.getRoot)
})

describe(u.yellow(`resolveSetup`), () => {
  describe(`when resolving traversal references`, () => {
    let ref1: nt.ReferenceString
    // @ts-ignore
    let ref2: nt.ReferenceString
    let baseCheckViewButton: nt.ComponentObject
    let pageComponents: nt.ComponentObject[]

    beforeEach(() => {
      ref1 = '_____.colorChange' as nt.ReferenceString
      ref2 = '____.viewTag' as nt.ReferenceString
      baseCheckViewButton = {
        type: 'button',
        text: 'OK',
        style: {
          get color() {
            return ref1
          },
          border: {
            style: '3',
            get color() {
              return ref1
            },
          },
          borderWidth: '3',
        },
      }
      pageComponents = [
        {
          type: 'view',
          colorChange: '0x2000e6',
          viewTag: 'redTag',
          children: [
            {
              type: 'popUp',
              message: 'Please add a facility',
              colorChange: '0x2988e6',
              style: { colorChange: '0x1111e6', backgroundColor: '0xffffff00' },
              children: [
                {
                  type: 'view',
                  id: 'a',
                  style: {
                    border: { style: '3' },
                    borderColor: '#f4f8fa',
                    borderWidth: '3',
                  },
                  children: [
                    {
                      ...baseCheckViewButton,
                      id: 'tp',
                      viewTag: '_______.viewTag',
                      onClick: [
                        {
                          actionType: 'popUpDismiss',
                          popUpView: 'disTag',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]
    })

    it(`should not cause an infinite loop when the value can't be found`, async () => {
      await nui.resolveComponents({
        components: [m.image({ style: { fontSize: '_____.topo' } })],
      })
      expect(true).to.be.true
    })

    // TODO - fix
    it.skip(`should resolve the traversal reference`, async () => {
      process.stdout.write('\x1Bc')
      await nui.resolveComponents({ components: pageComponents })
      const { component } = nui.cache.component.find(
        (obj) => obj.component.id === 'tp',
      )
      console.log(component.props)
      expect(component.props['data-viewtag']).to.eq('redTag')
    })
  })

  describe(u.italic('on'), () => {
    describe(`if`, () => {
      it(`should return value at index 1 if true`, async () => {
        const [component] = await nui.resolveComponents({
          components: [m.label({ text: { if: [1, 'abc', 'wow'] } })],
          on: { if: () => true },
        })
        // @ts-expect-error
        expect(component.get('text')).to.eq('abc')
      })

      it(`should return value at index 2 if false`, async () => {
        const component = await nui.resolveComponents({
          components: m.label({ text: { if: [1, 'abc', 'wow'] } }),
          on: { if: () => false },
        })
        expect(component.get('text')).to.eq('wow')
      })

      it(`should be able to deeply resolve references`, async () => {
        nui.getRoot().Power = { patientInfoPage: '.Sun.viewTag' }
        const component = await nui.resolveComponents({
          components: m.label({
            text: { if: [1, '.Power.patientInfoPage', 'wow'] },
          }),
        })
        expect(component.get('text')).to.eq(
          nui.getRoot().Hello.formData.password,
        )
      })
    })

    describe(`pageComponentUrl`, () => {
      it(`should resolve TargetPage@CurrentPage#viewTag`, async () => {
        u.assign(nui.getRoot(), {
          Power: { patientInfoPage: 'Rawr' },
        })
        const component = await nui.resolveComponents({
          components: m.label({
            goto: '.Power.patientInfoPage@Sun#..formData.password',
          }),
        })
        const result = component.get('goto')
        expect(result).to.eq(
          `Rawr@Sun#${nui.getRoot().Hello.formData.password}`,
        )
      })
    })
  })

  describe(`async emits`, () => {
    async function resolveComponent(component: nt.ComponentObject) {
      const page = nui.createPage({
        name: 'Hello',
        viewport: { width: 375, height: 667 },
      })

      return {
        component: await nui.resolveComponents({ components: component, page }),
        page,
      }
    }

    it(`should only run the provided callback once per action`, async () => {
      const spy = sinon.spy()
      nui.use({ evalObject: spy })
      const { component } = await resolveComponent(
        m.label({ onClick: [m.evalObject(), m.evalObject()] }),
      )
      // @ts-expect-error
      await component.get('onClick').execute({})
      await waitFor(() => expect(spy).to.be.calledTwice)
    })

    it(`should only run the provided callback once per emit action`, async () => {
      const trigger = 'onChange'
      const spy = sinon.spy()
      nui.use({ emit: { [trigger]: spy } })
      const { component } = await resolveComponent(
        m.label({
          [trigger]: [m.evalObject, m.emitObject(), m.evalObject],
        } as any),
      )
      // @ts-expect-error
      await component.get(trigger)?.execute({})
      await waitFor(() => expect(spy).to.be.calledOnce)
    })
  })
})

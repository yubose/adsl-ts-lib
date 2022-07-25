import { expect } from 'chai'
import sinon from 'sinon'
import isEqual from 'lodash/isEqual'
import y from 'yaml'
import Root from '../DocRoot'
import createNode from '../utils/createNode'
import deref, { DerefResult } from '../utils/deref'

let root: Root

beforeEach(() => {
  root = new Root()
})

describe(`deref`, () => {
  it(`should initiate the state expectedly`, () => {
    const spy = sinon.spy()
    const ref = '.SignIn.components.1.children.0.text'
    deref({ node: ref, root, rootKey: 'SignIn', subscribe: { onUpdate: spy } })
    const firstCallArgs = spy.firstCall.args
    const initialState = firstCallArgs[1]
    expect(initialState).to.have.deep.property('paths', [
      'components',
      '1',
      'children',
      '0',
      'text',
    ])
    expect(initialState).to.have.property('results').to.have.lengthOf(1)
  })

  it(`should update the next state's path and paths expectedly`, () => {
    const spy = sinon.spy()
    const ref = '.SignIn.components.1.children.0.text'
    deref({ node: ref, root, rootKey: 'SignIn', subscribe: { onUpdate: spy } })
    const secondCallArgs = spy.secondCall.args
    const secondCallNextState = secondCallArgs[1]
    expect(secondCallNextState).to.have.deep.property('paths', [
      '1',
      'children',
      '0',
      'text',
    ])
  })

  describe(`when inserting each result`, () => {
    let spy: sinon.SinonSpy
    let ref = '.SignIn.components.1.children.0.text'

    beforeEach(() => {
      spy = sinon.spy()
      deref({
        node: ref,
        root,
        rootKey: 'SignIn',
        subscribe: { onUpdate: spy },
      })
    })

    it(`the initial result should be empty`, () => {
      const [initial] = spy.getCall(0).args
      expect(initial).to.have.property('paths').to.be.an('array').that.is.empty
      expect(initial).to.have.property('results').to.be.an('array').that.is
        .empty
    })

    it(`should start the first call's result to the value from root`, () => {
      const [_, first] = spy.getCall(0).args
      expect(first.paths).to.have.all.members([
        'components',
        '1',
        'children',
        '0',
        'text',
      ])
      const value = first.results[0].value
      const expectedResult = root.get('SignIn').toJSON()
      expect(first.results).to.have.lengthOf(1)
      expect(isEqual(value, expectedResult)).to.be.true
    })

    describe(`when the result is another (chained) reference`, () => {
      describe(`when the reference is local`, () => {
        beforeEach(() => {
          root.clear()
        })

        it(`should append the next result as the retrieved value from the next key in the path`, () => {
          root.set('A', {
            email: 'lopez@yahoo.com',
            insideHereIsYourEmail: { email: '..email' },
            whatIsMyEmail: '..components.0.text',
            components: [
              {
                type: 'label',
                text: '..insideHereIsYourEmail.email',
                what: '..whatIsMyEmail',
              },
            ],
          })
          const node = createNode('.A.whatIsMyEmail')
          const derefed = deref({ node, root, rootKey: 'A' })
          const results = derefed.results as DerefResult[]
          const [first, second, third, fourth, fifth, sixth, seventh] = results
          const A = first.value
          expect(first).to.have.property('key', 'A')
          expect(second).to.have.property('key', 'whatIsMyEmail')
          expect(third).to.have.property('key', 'components')
          expect(fourth).to.have.property('key', '0')
          expect(fifth).to.have.property('key', 'text')
          expect(sixth).to.have.property('key', 'insideHereIsYourEmail')
          expect(seventh).to.have.property('key', 'email')
          expect(first).to.have.property('value', A)
          expect(second).to.have.property('value', A.whatIsMyEmail)
          expect(third).to.have.deep.property('value', A.components)
          expect(fourth).to.have.deep.property('value', A.components[0])
          expect(fifth).to.have.property('value', A.components[0].text)
          expect(sixth).to.have.deep.property('value', A.insideHereIsYourEmail)
          expect(seventh).to.have.deep.property(
            'value',
            A.insideHereIsYourEmail.email,
          )
        })
      })

      // TODO - Add depth

      describe(`when the reference is root`, () => {
        it(`should append the next result as the retrieved value from the root using root key`, () => {
          root.set('B', {
            components: [
              { type: 'label', text: '.A.insideHereIsYourEmail.email' },
            ],
          })
          root.set('A', {
            email: 'lopez@yahoo.com',
            insideHereIsYourEmail: { email: '..email' },
            whatIsMyEmail: '.B.components.0.text',
            components: [
              {
                type: 'label',
                text: '..whatIsMyEmail',
              },
            ],
          })
          const node = createNode('.A.components.0.text')
          const derefed = deref({ node, root, rootKey: 'A' })
          const results = derefed.results
          // prettier-ignore
          const [ first, second, third, fourth, fifth, sixth, seventh, eighth, ninth, tenth, eleventh, twelve, thirteenth, fourteenth, ] = results as DerefResult[]

          const A = root.get('A').toJS()
          const B = root.get('B').toJS()

          expect(first).to.have.property('key', 'A')
          expect(second).to.have.property('key', 'components')
          expect(third).to.have.property('key', '0')
          expect(fourth).to.have.property('key', 'text')
          expect(fifth).to.have.property('key', 'whatIsMyEmail')
          expect(sixth).to.have.property('key', 'B')
          expect(seventh).to.have.property('key', 'components')
          expect(eighth).to.have.property('key', '0')
          expect(ninth).to.have.property('key', 'text')
          expect(tenth).to.have.property('key', 'A')
          expect(eleventh).to.have.property('key', 'insideHereIsYourEmail')
          expect(twelve).to.have.property('key', 'email')
          expect(thirteenth).to.have.property('key', 'email')
          expect(fourteenth).to.be.undefined

          expect(first).to.have.deep.property('value', A)
          expect(second).to.have.deep.property('value', A.components)
          expect(third).to.have.deep.property('value', A.components[0])
          expect(fourth).to.have.property('value', A.components[0].text)
          expect(fifth).to.have.property('value', A.whatIsMyEmail)
          expect(sixth).to.have.deep.property('value', B)
          expect(seventh).to.have.deep.property('value', B.components)
          expect(eighth).to.have.deep.property('value', B.components[0])
          expect(ninth).to.have.property('value', B.components[0].text)
          expect(tenth).to.have.deep.property('value', A)
          expect(eleventh).to.have.deep.property(
            'value',
            A.insideHereIsYourEmail,
          )
          expect(twelve).to.have.deep.property(
            'value',
            A.insideHereIsYourEmail.email,
          )
          expect(thirteenth).to.have.property('value', A.email)
          expect(fourteenth).to.be.undefined
        })

        xit(`should append the next result as the retrieved value from the new root node from the new root path`, () => {
          //
        })
      })

      xit(`should append the next result from the original deref after appending all of the results of the chained (children) derefed reference calls`, () => {
        //
      })
    })
  })

  {
    beforeEach(() => {
      root.set('Topo', {
        formData: {
          password: '123',
          email: 'pfft@gmail.com',
          currentIcon: '..icon',
          gender: 'Male',
        },
        icon: 'arrow.svg',
      })
      root.set('SignIn', {
        email: 'lopez@yahoo.com',
        components: [
          { type: 'button', text: '..greeting' },
          {
            type: 'view',
            children: [
              { type: 'label', text: '.SignIn.email' },
              { type: 'textField', dataKey: 'SignIn.email' },
            ],
          },
        ],
      })
    })

    it(`should set resolved references on the "value" key `, () => {
      const ref = '.SignIn.components.1.children.0.text'
      const result = deref({
        node: ref,
        root,
        rootKey: 'SignIn',
      })
      expect(result).to.have.property('value', 'lopez@yahoo.com')
    })

    it(`should be able to resolve multiple chains of root references`, () => {
      const signinDoc = root.get('SignIn')
      const topoDoc = root.get('Topo')
      root.set('Pencil', {
        listObject: [
          'hi',
          3,
          {
            options: [
              {
                gender: [
                  { value: 'Female' },
                  { value: '.SignIn.formData.gender' },
                  { value: 'Other' },
                ],
                findGender: '.Topo.redirect.realGenderLocation',
              },
            ],
          },
          { what: {} },
        ],
      })
      signinDoc.set('dog', '.Topo.findMyGender')
      topoDoc.set('findMyGender', '.Pencil.listObject.2.options.0.findGender')
      topoDoc.set('redirect', {
        realGenderLocation: '.Pencil.listObject.2.options.0.gender.1.value',
      })
      signinDoc.set('formData', { gender: '.Topo.formData.gender' })
      expect(
        deref({
          node: new y.Scalar('.SignIn.dog'),
          root,
          rootKey: 'SignIn',
        }),
      ).to.have.property('value', 'Male')
    })

    it(`should be able to resolve multiple chains of local references`, () => {
      const getResult = (ref: string) =>
        deref({
          node: ref,
          root,
          rootKey: 'Topo',
        }).value
      const topoDoc = root.get('Topo')
      topoDoc.set('cat', '..formData.currentIcon')
      expect(getResult('..formData.currentIcon')).to.eq('arrow.svg')
      topoDoc.set('cat', {
        cloudy: {
          sunset: {
            oneOf: ['abc', '..formData.currentIcon'],
          },
        },
      })
      expect(getResult('..formData.currentIcon')).to.eq('arrow.svg')
    })
  }

  describe(`when unable to resolve multiple chains of references`, () => {
    describe(`when a path is missing during traversing`, () => {
      const lastKey = 'currentFormValues'
      const lastPathItemAttempted = 'incorrect'
      const lastValidRef = '.Tiger.incorrect.Path.toFormValues'
      const pathsRemaining = 'incorrect.Path.toFormValues'.split('.')
      let refNode: y.Scalar<string>

      beforeEach(() => {
        root.clear()
        refNode = createNode('.Tiger.formData.userProfile')

        const Resource = {
          user: '.Resource.formValues',
          formValues: '..currentFormValues',
          currentFormValues: '.Tiger.incorrect.Path.toFormValues',
        }

        const Tiger = {
          formData: {
            userProfile: '..profile.user',
          },
          profile: {
            user: '.Resource.user',
          },
          formValues: {
            firstName: 'Bob',
            lastName: 'Gonzalez',
          },
        }

        root.set('Resource', Resource)
        root.set('Tiger', Tiger)
      })

      xit(`should set resolved: false in the overall result`, () => {
        //
      })

      xit(`should attach pathsRemaining in the overall result`, () => {
        //
      })

      xit(`should attach lastKeyTried in the overall result`, () => {
        //
      })

      it.skip(`should set the overall result value as the last valid reference attempted`, () => {
        const derefed = deref({ node: refNode, root, rootKey: 'Tiger' })
        const results = derefed.results as DerefResult[]
        const lastResult = results[results.length - 1]
        console.dir(derefed, { depth: Infinity })
        expect(derefed).to.have.property('value', lastValidRef)
        // expect(derefed).to.have.property('value', lastValidRef)
      })
    })

    describe(`when the final path is missing at the very end of traversing`, () => {
      it.skip(`should set the last resolvable ref as its final value`, () => {
        const ref = createNode('.Tiger.formData.userProfile')
        const derefed = deref({ node: ref, root, rootKey: 'Tiger' })
        const results = derefed.results as DerefResult[]
        expect(results).to.have.lengthOf(14)
        expect(results[13]).to.have.property('key', 'userProfile')
        expect(results[13]).to.have.property('value', '.Resource.user')
      })
    })
  })
})

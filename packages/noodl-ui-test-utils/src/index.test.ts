import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import actionFactory from './factories/action'
import componentFactory from './factories/component'

const ui = { ...actionFactory, ...componentFactory }

describe(u.yellow(`noodl-ui-test-utils`), () => {
  it(`should create a goto object`, () => {
    const goto = actionFactory.goto('SignIn')
    expect(goto).to.be.an('object').to.have.property('goto', 'SignIn')
  })

  it(`should create an evalObject`, () => {
    const obj = actionFactory.evalObject()
    expect(obj).to.be.an('object').to.have.property('object', undefined)
  })

  it(`[builtIn] should auto assign the key and value if given the funcName`, () => {
    const res = ui.builtIn({ funcName: 'bob', wait: true })
    expect(res).to.have.property('funcName', 'bob')
    expect(res).to.have.property('wait', true)
  })

  it(`[removeSignature] should create dataKey and dataObject properties`, () => {
    const res = ui.removeSignature({ dataKey: 'fa', dataObject: {} })
    expect(res).to.have.property('dataKey')
    expect(res).to.have.property('dataObject')
  })

  xit(`[goto] should create the goto object`, () => {
    expect(ui.goto()).to.have.property('goto')
    expect(ui.goto('hello')).to.have.property('goto', 'hello')
    expect(ui.goto({ destination: 'af' }))
      .to.have.property('goto')
      .to.be.an('object')
      .to.have.property('destination', 'af')
  })

  it(`[ifObject] should create the if object`, () => {
    expect(ui.ifObject([{}, {}, {}]))
      .to.have.property('if')
      .to.deep.eq([{}, {}, {}])
    expect(ui.ifObject({ if: [{}, {}, {}] }))
      .to.have.property('if')
      .to.deep.eq([{}, {}, {}])
  })

  it(`[emit] should create the emit object`, () => {
    expect(ui.emit({ dataKey: {}, actions: [{ f: 'f' }] })).to.deep.eq({
      emit: { dataKey: {}, actions: [{ f: 'f' }] },
    })
  })

  it(`[popUp] should create a popUp action object`, () => {
    expect(ui.popUp()).to.deep.eq({ actionType: 'popUp', popUpView: '' })
  })

  it(`[popUp] should use the string arg as the value for popUpView`, () => {
    expect(ui.popUp('hello')).to.deep.eq({
      actionType: 'popUp',
      popUpView: 'hello',
    })
  })

  it(`[popUpDismiss] should create a popUp action object`, () => {
    expect(ui.popUpDismiss()).to.deep.eq({
      actionType: 'popUpDismiss',
      popUpView: '',
    })
  })

  it(`[popUpDismiss] should use the string arg as the value for popUpView`, () => {
    expect(ui.popUpDismiss('hello')).to.deep.eq({
      actionType: 'popUpDismiss',
      popUpView: 'hello',
    })
  })

  describe(`components`, () => {
    it(`[button] should create a button component object`, () => {
      expect(ui.button()).to.deep.eq({ type: 'button' })
    })

    it(`[button] should use the string arg as the value for text`, () => {
      expect(ui.button('hello')).to.deep.eq({ type: 'button', text: 'hello' })
    })

    it(`[button] should use the array arg as the value for onClick`, () => {
      const onClick = [{}, {}]
      expect(ui.button(onClick)).to.deep.eq({ type: 'button', onClick })
    })

    it(`[header] should create a header component object`, () => {
      expect(ui.header()).to.deep.eq({ type: 'header' })
    })

    it(`[image] should create an image component object`, () => {
      expect(ui.image()).to.deep.eq({ type: 'image', path: '' })
    })

    it(`[image] should set the string arg as path`, () => {
      expect(ui.image('signIn.png')).to.deep.eq({
        type: 'image',
        path: 'signIn.png',
      })
    })

    it(`[image] should return the image object`, () => {
      const result = { type: 'image', path: 'signIn.png' }
      expect(ui.image({ path: 'signIn.png' })).to.deep.eq(result)
      expect(ui.image({ type: 'image', path: 'signIn.png' })).to.deep.eq(result)
    })

    it(`[label] should create a component object`, () => {
      expect(ui.label()).to.deep.eq({ type: 'label' })
    })

    it(`[label] should set the string arg as dataKey`, () => {
      expect(ui.label('Abc.SignIn.formData.password')).to.deep.eq({
        type: 'label',
        dataKey: 'Abc.SignIn.formData.password',
      })
    })

    it(`[list] should create a component object, default contentType to listObject, iteratorVar to itemObject and listObject to an empty string`, () => {
      const list1 = ui.list()
      const list2 = ui.list('Hello')
      const list3 = ui.list([1, 2, {}])

      expect(ui.list()).to.deep.eq({
        type: 'list',
        contentType: 'listObject',
        iteratorVar: 'itemObject',
        listObject: '',
      })
    })

    it(`[list] should set the string arg as listObject`, () => {
      expect(ui.list('.Abc.SignIn.formData.password')).to.deep.eq({
        type: 'list',
        contentType: 'listObject',
        iteratorVar: 'itemObject',
        listObject: '.Abc.SignIn.formData.password',
      })
    })

    it(`[list] should set the array arg as listObject`, () => {
      const listObject = [1, 2, {}]
      expect(ui.list(listObject)).to.deep.eq({
        type: 'list',
        contentType: 'listObject',
        iteratorVar: 'itemObject',
        listObject,
      })
    })

    it(`[list] should merge the props into the list component object`, () => {
      const listObject = [1, 2, {}]
      expect(
        ui.list({
          iteratorVar: 'apple',
          listObject,
        }),
      ).to.deep.eq({
        type: 'list',
        iteratorVar: 'apple',
        listObject,
        contentType: 'listObject',
      })
    })

    it(`[listItem] should create a component object and default a property itemObject to an empty string`, () => {
      expect(ui.listItem()).to.deep.eq({ type: 'listItem', itemObject: '' })
    })

    it(`[listItem] should create a component object and merge the props to the component object`, () => {
      const dataObject = { fruits: [1, 2, 3] }
      expect(ui.listItem({ dataObject })).to.deep.eq({
        type: 'listItem',
        itemObject: '',
        dataObject,
      })
    })

    it(`[listItem] should create a component object and use the 2nd arg as the dataObject`, () => {
      const dataObject = { fruits: [1, 2, 3] }
      expect(ui.listItem('apple', dataObject)).to.deep.eq({
        type: 'listItem',
        apple: dataObject,
      })
    })

    it(`[listItem] should create a component object and use the 2nd arg as the dataObject`, () => {
      const dataObject = { fruits: [1, 2, 3] }
      expect(ui.listItem({ apple: '' }, dataObject)).to.deep.eq({
        type: 'listItem',
        apple: '',
        itemObject: dataObject,
      })
    })

    it(`[page] should create a component object and default path property to an empty string`, () => {
      expect(ui.page()).to.deep.eq({ type: 'page', path: '' })
    })

    it(`[page] should create a component object and use the string arg as path`, () => {
      expect(ui.page('SignIn')).to.deep.eq({
        type: 'page',
        path: 'SignIn',
      })
    })

    it(`[page] should create a component object and merge the props to the component object`, () => {
      const options = [{ fruits: [1, 2, 3] }]
      expect(ui.page({ options })).to.deep.eq({
        type: 'page',
        path: '',
        options,
      })
    })

    it(`[plugin] should create a component object and default path property to an empty string`, () => {
      expect(ui.plugin()).to.deep.eq({ type: 'plugin', path: '' })
    })

    it(`[plugin] should create a component object and use the string arg as path`, () => {
      expect(ui.plugin('SignIn')).to.deep.eq({
        type: 'plugin',
        path: 'SignIn',
      })
    })

    it(`[plugin] should create a component object and merge the props to the component object`, () => {
      const options = [{ fruits: [1, 2, 3] }]
      expect(ui.plugin({ options })).to.deep.eq({
        type: 'plugin',
        path: '',
        options,
      })
    })

    it(`[popUp] should create a component object and default popUpView property to an empty string`, () => {
      expect(ui.popUpComponent()).to.deep.eq({ type: 'popUp', popUpView: '' })
    })

    it(`[popUp] should create a component object and use the string arg as popUpView`, () => {
      expect(ui.popUpComponent('myView')).to.deep.eq({
        type: 'popUp',
        popUpView: 'myView',
      })
    })

    it(`[popUp] should create a component object and merge the props to the component object`, () => {
      const options = [{ fruits: [1, 2, 3] }]
      expect(ui.popUpComponent({ options })).to.deep.eq({
        type: 'popUp',
        popUpView: '',
        options,
      })
    })

    it(`[select] should create a component object and default options property to an empty string`, () => {
      expect(ui.select()).to.deep.eq({ type: 'select', options: '' })
    })

    it(`[select] should create a component object and merge the props to the component object`, () => {
      const options = [{ fruits: [1, 2, 3] }]
      expect(ui.select({ options })).to.deep.eq({ type: 'select', options })
    })

    it(`[select] should create a component object and use the array arg as the options`, () => {
      const options = [{ fruits: [1, 2, 3] }]
      expect(ui.select(options)).to.deep.eq({ type: 'select', options })
    })

    it(`[textField] should create a component object`, () => {
      expect(ui.textField()).to.deep.eq({ type: 'textField' })
    })

    it(`[textField] should create a component object and merge the props to the component object`, () => {
      expect(ui.textField({ abc: {}, style: {} })).to.deep.eq({
        type: 'textField',
        abc: {},
        style: {},
      })
    })

    it(`[textField] should create a component object and use the string arg as the dataKey`, () => {
      expect(ui.textField('SignIn.formData')).to.deep.eq({
        type: 'textField',
        dataKey: 'SignIn.formData',
      })
    })

    it(`[video] should create a component object`, () => {
      expect(ui.video()).to.deep.eq({ type: 'video' })
    })

    it(`[video] should create a component object and use the string arg as the path`, () => {
      expect(ui.video('someVideo.mkv')).to.deep.eq({
        type: 'video',
        path: 'someVideo.mkv',
      })
    })

    it(`[video] should create a component object and merge the props to the component object`, () => {
      expect(
        ui.video({ abc: {}, style: {}, videoFormat: 'video/mp4' }),
      ).to.deep.eq({
        type: 'video',
        abc: {},
        style: {},
        videoFormat: 'video/mp4',
      })
    })
  })
})

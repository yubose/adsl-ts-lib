import { expect } from 'chai'
import { coolGold, italic } from 'noodl-common'
import * as mock from 'noodl-ui-test-utils'
import sinon from 'sinon'
import createComponent from '../../utils/createComponent'
import ComponentCache from '../../cache/ComponentCache'
import NUIPage from '../../Page'
import { nui } from '../../utils/test-utils'

let componentCache: ComponentCache
let page: NUIPage

beforeEach(() => {
  componentCache = new ComponentCache()
  page = nui.createPage({ viewport: { width: 375, height: 667 } })
  page.page = 'CreateNewAccount'
})

describe(coolGold(`ComponentCache`), () => {
  describe(italic(`clear`), () => {
    it(`should clear only the components under that page if it is passed in`, () => {
      const signInComponents = Array(3)
        .fill(null)
        .map((_) => createComponent(mock.getButtonComponent()))
      const videoChatComponents = Array(3)
        .fill(null)
        .map((_) => createComponent(mock.getButtonComponent()))
      signInComponents.forEach((inst) => componentCache.add(inst, 'SignIn'))
      videoChatComponents.forEach((inst) =>
        componentCache.add(inst, 'VideoChat'),
      )
      expect(componentCache).to.have.lengthOf(6)
      componentCache.clear('SignIn')
      expect(componentCache).to.have.lengthOf(3)
      for (const obj of componentCache) {
        expect(obj).to.have.property('page', 'VideoChat')
      }
    })
  })

  describe(italic(`emit`), () => {
    it(`should call the funcs subscribed to the "add" hook`, () => {
      const spy = sinon.spy()
      const spy2 = sinon.spy()
      componentCache.on('add', spy)
      componentCache.on('add', spy2)
      expect(spy).not.to.be.calledOnce
      expect(spy2).not.to.be.calledOnce
      componentCache.add({} as any, page)
      expect(spy).to.be.calledOnce
      expect(spy2).to.be.calledOnce
    })

    it(`should call the funcs subscribed to the "clear" hook`, () => {
      const spy = sinon.spy()
      const spy2 = sinon.spy()
      componentCache.on('clear', spy)
      componentCache.on('clear', spy2)
      expect(spy).not.to.be.calledOnce
      expect(spy2).not.to.be.calledOnce
      const component = createComponent('button')
      componentCache.add(component, page)
      componentCache.add(component, page)
      expect(spy).not.to.be.calledOnce
      expect(spy2).not.to.be.calledOnce
      componentCache.clear()
      expect(spy).to.be.calledOnce
      // expect(spy2).to.be.calledOnce
    })

    it(`should call the funcs subscribed to the "remove" hook`, () => {
      const spy = sinon.spy()
      const spy2 = sinon.spy()
      componentCache.on('remove', spy)
      componentCache.on('remove', spy2)
      const component = createComponent('label')
      componentCache.add(component, page)
      expect(spy).not.to.be.calledOnce
      expect(spy2).not.to.be.calledOnce
      componentCache.remove(component)
      expect(spy).to.be.calledOnce
      expect(spy2).to.be.calledOnce
    })
  })

  describe(italic(`get`), () => {
    it(`should return the component instance if given the component instance`, () => {
      const component = createComponent('select')
      componentCache.add(component, page)
      expect(componentCache.get(component).component).to.eq(component)
    })

    it(`should return the component instance if given the component id`, () => {
      const component = createComponent('select')
      componentCache.add(component, page)
      expect(componentCache.get(component.id).component).to.eq(component)
    })

    it(`should return the whole component cache object if args is empty`, () => {
      expect(componentCache.get()).to.be.instanceOf(Map)
    })

    it(`should return an object with a component and page prop`, () => {
      const component = createComponent('select')
      const obj = componentCache.add(component, page)
      expect(obj).to.have.property('component').to.eq(component)
      expect(obj).to.have.property('page').to.eq('CreateNewAccount')
    })

    it(`should accept strings`, () => {
      const component = createComponent('select')
      const obj = componentCache.add(component, 'Frog')
      expect(obj).to.have.property('component').to.eq(component)
      expect(obj).to.have.property('page').to.eq('Frog')
    })
  })
})

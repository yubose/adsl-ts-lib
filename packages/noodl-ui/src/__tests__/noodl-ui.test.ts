import * as u from '@jsmanifest/utils'
import sinon from 'sinon'
import sample from 'lodash/sample'
import { waitFor } from '@testing-library/dom'
import { isActionChain } from 'noodl-action-chain'
import { userEvent } from 'noodl-types'
import { expect } from 'chai'
import { createDataKeyReference, nui, ui } from '../utils/test-utils'
import {
  groupedActionTypes,
  nuiEmitType,
  nuiEmitTransaction,
  triggers as nuiTriggers,
} from '../constants'
import Component from '../Component'
import NuiPage from '../Page'
import NUI from '../noodl-ui'

const viewport = { width: 375, height: 667 }

describe(u.italic(`createActionChain`), () => {
  it(`should create and return an ActionChain instance`, () => {
    expect(isActionChain(nui.createActionChain('onBlur', [ui.divider()]))).to.be
      .true
  })

  userEvent.forEach((evt) => {
    it(`should attach the ActionChain instance to ${u.magenta(evt)}`, () => {
      const ac = nui.createActionChain(
        'onClick',
        ui.video({ [sample(userEvent) as any]: [ui.popUp()] }),
      )
      expect(isActionChain(ac)).to.be.true
    })
  })

  it(`should attach the action handlers from the store `, async () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const spy3 = sinon.spy()
    const spy4 = sinon.spy()
    const spy5 = sinon.spy()
    const spy6 = sinon.spy()
    const spy7 = sinon.spy()
    const spy8 = sinon.spy()
    const spies = [spy1, spy2, spy3, spy4, spy5, spy6, spy7, spy8]
    const page = nui.createPage()
    nui.use({
      builtIn: { too: spy4 },
      emit: { onFocus: spy3 },
      goto: spy1,
      pageJump: spy2,
      saveObject: spy5,
      updateObject: spy6,
      evalObject: spy7,
      refresh: spy8,
    })
    const ac = nui.createActionChain(
      'onFocus',
      [
        ui.pageJump(),
        ui.emit(),
        ui.goto(),
        ui.builtIn({ funcName: 'too' } as any),
        ui.refresh(),
        ui.saveObject(),
        ui.updateObject(),
        ui.evalObject(),
      ],
      {
        component: await nui.resolveComponents({
          components: ui.view(),
          page,
        }),
        loadQueue: true,
        page,
      },
    )
    await ac.execute()
    spies.forEach((s) => expect(s).to.be.calledOnce)
  })

  it(`should attach builtIn action handlers from the store`, async () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    nui.use({ builtIn: { cereal: spy2, kitty: spy1 } })
    const page = nui.createPage()
    const ac = nui.createActionChain(
      'onHover',
      [ui.builtIn('kitty'), ui.builtIn('cereal')],
      {
        component: await nui.resolveComponents({
          components: ui.label(),
          page,
        }),
        loadQueue: true,
        page,
      },
    )
    await ac.execute()
    expect(spy1).to.be.calledOnce
    expect(spy2).to.be.calledOnce
  })

  it(
    `should be able to re-load the action handlers/builtIn action ` +
      `handlers from the store when action chains refresh`,
    async () => {
      const spy1 = sinon.spy()
      const spy2 = sinon.spy()
      const spy3 = sinon.spy()
      const spy4 = sinon.spy()
      const spy5 = sinon.spy()
      const spy6 = sinon.spy()
      const spy7 = sinon.spy()
      const spy8 = sinon.spy()
      const spies = [spy1, spy2, spy3, spy4, spy5, spy6, spy7, spy8]
      const page = nui.createPage()
      nui.use({
        builtIn: { too: spy4 },
        emit: { onFocus: spy3 },
        goto: spy1,
        pageJump: spy2,
        saveObject: spy5,
        updateObject: spy6,
        evalObject: spy7,
        refresh: spy8,
      })
      const ac = nui.createActionChain(
        'onFocus',
        [
          ui.pageJump(),
          ui.emit(),
          ui.goto(),
          ui.builtIn('too'),
          ui.refresh(),
          ui.saveObject(),
          ui.updateObject(),
          ui.evalObject(),
        ],
        {
          component: await nui.resolveComponents({
            components: ui.view(),
            page,
          }),
          loadQueue: true,
          page,
        },
      )
      await ac.execute()
      spies.forEach((s, i) => {
        expect(s).to.be.calledOnce
      })
    },
  )
})

describe(u.italic(`createComponent`), () => {
  it(`should add the component to the component cache`, () => {
    // @ts-expect-error
    const component = nui.createComponent(ui.button())
    expect(nui.cache.component.has(component)).to.be.true
  })
})

describe(u.italic(`createPage`), () => {
  beforeEach(() => {
    nui.reset()
    nui.getRootPage().page = 'SignIn'
  })

  it(`should set the page to the page name if passed as args`, () => {
    const page = nui.createPage('Coffee')
    expect(page).to.have.property('page', 'Coffee')
  })

  it(`should set the page to the page name and id to id`, () => {
    const args = { id: 'abc', name: 'Shoe' }
    const page = nui.createPage(args)
    expect(page).to.have.property('id', 'abc')
    expect(page).to.have.property('page', 'Shoe')
  })

  it(`should create and return a new Page instance from the PageCache`, () => {
    const page = nui.createPage({ name: 'Hello', viewport })
    expect(page).to.be.instanceOf(NuiPage)
    expect(nui.cache.page.has(page?.id || '')).to.be.true
    expect(nui.cache.page.get(page?.id || '').page).to.eq(page)
  })

  it(`should create a new page even if the page name is being used in another page`, () => {
    const page = nui.createPage('SignIn')
    expect(page).not.to.eq(nui.getRootPage())
  })

  it(
    `should set the onChange fn and not add duplicates if it is already in ` +
      `the fns list`,
    () => {
      const spy = sinon.spy()
      const page = nui.createPage({
        name: 'SignIn',
        onChange: { id: 'me', fn: spy },
      })
      expect(page.onChange.get('me')).to.be.a('function')
    },
  )

  it(`should call the provided fn on page change`, () => {
    nui.reset()
    const spy = sinon.spy()
    const page = nui.createPage({
      name: 'SignIn',
      onChange: { id: 'me', fn: spy },
    })
    page.page = 'Hello'
    expect(spy).to.be.calledOnce
    expect(spy.args[0][0]).to.eq('SignIn')
    expect(spy.args[0][1]).to.eq('Hello')
  })

  it(
    `should default to creating a new page if another page instance is on the same ` +
      `page but no page component or NuiPage was provided`,
    () => {
      const page1 = nui.createPage('Cereal')
      const page2 = nui.createPage('Cereal')
      expect(page1).to.be.instanceOf(NuiPage)
      expect(page2).to.be.instanceOf(NuiPage)
      expect(page1.id).to.not.eq(page2.id)
      expect(page1.key).not.to.eq(page2.key)
      expect(page1).not.to.eq(page2)
    },
  )

  it(`should return the NuiPage back if it was provided`, () => {
    const page = nui.createPage('Cereal')
    expect(nui.createPage(page)).to.eq(page)
  })

  it(
    `should return the existing NuiPage if the component is a page component ` +
      `sharing the same id`,
    async () => {
      const componentObject = ui.view({
        children: [ui.page({ path: 'Cereal' })],
      })
      const component = await nui.resolveComponents(componentObject)
      const pageComponent = component.child()
      const page = nui.cache.page.get(pageComponent.id).page
      expect(page).to.have.property('id').to.eq(pageComponent.id)
      expect(nui.cache.page.length).to.eq(2)
      expect(nui.createPage(pageComponent)).to.eq(page)
    },
  )

  describe(`when reusing page instances`, () => {
    it(
      `should not duplicate another instance when providing an ` +
        `existing page component`,
      async () => {
        const componentObject = ui.view({
          children: [ui.page({ path: 'Cereal' })],
        })
        expect(nui.cache.page.length).to.eq(1)
        const component = await nui.resolveComponents(componentObject)
        expect(nui.cache.page.length).to.eq(2)
        const pageComponent = component.child()
        const page = nui.cache.page.get(pageComponent.id).page
        await nui.resolveComponents({ components: pageComponent, page })
        expect(nui.cache.page.length).to.eq(2)
        expect(page).to.eq(pageComponent.get('page'))
      },
    )
  })

  it(`should not duplicate another instance`, async () => {
    nui.reset()
    nui.getRootPage()
    const componentObject = ui.view({
      children: [ui.page({ path: 'Cereal' })],
    })
    expect(nui.cache.page.length).to.eq(1)
    const component = await nui.resolveComponents(componentObject)
    expect(nui.cache.page.length).to.eq(2)
    const pageComponent = component.child()
    const page = nui.cache.page.get(pageComponent.id).page
    pageComponent.edit('page', page)
    await nui.resolveComponents({
      components: componentObject,
      page,
    })
    await nui.resolveComponents({
      components: componentObject,
      page,
    })
    await nui.resolveComponents({
      components: componentObject,
      page,
    })
    expect(nui.cache.page.length).to.eq(2)
    expect(page).to.eq(pageComponent.get('page'))
  })
})

describe(u.italic(`createPlugin`), () => {
  it(`should add plugins of ${u.magenta('head')}`, () => {
    let obj = { location: 'head', path: 'abc.html' } as any
    expect(NUI.cache.plugin.has(NUI.createPlugin('head', obj).id as string)).to
      .be.true
  })

  it(`should add plugins of ${u.magenta('body-top')}`, () => {
    let obj = { location: 'body-top', path: 'abc.html' } as any
    expect(NUI.cache.plugin.has(nui.createPlugin('body-top', obj).id as string))
      .to.be.true
  })

  it(`should add plugins of ${u.magenta('body-bottom')}`, () => {
    let obj = { location: 'body-bottom', path: 'abc.html' } as any
    const { id } = nui.createPlugin('body-bottom', obj)
    expect(NUI.cache.plugin.has(id as string)).to.be.true
  })
})

describe(u.italic(`createSrc`), () => {
  describe(`when passing in a string`, () => {
    it(`should just return the url untouched if it starts with http`, async () => {
      const url = `https://www.google.com/hello.jpeg`
      expect(await nui.createSrc(url)).to.eq(url)
    })

    it(`should format and prepend the assetsUrl if it does not start with http`, async () => {
      const path = `abc.jpeg`
      expect(await nui.createSrc(path)).to.eq(nui.getAssetsUrl() + path)
    })
  })

  describe(`when passing in an emit object`, () => {
    it(`should format the string if it doesn't start with http`, async () => {
      const path = 'too.jpg'
      const emit = { emit: { dataKey: { var1: 'abc' }, actions: [] } }
      nui.use({ emit: { path: async () => path as any } })
      const res = await nui.createSrc(emit)
      await waitFor(() => expect(res).to.eq(nui.getAssetsUrl() + path))
    })

    it(`should resolve to the returned value from the promise if it starts with http`, async () => {
      const path = 'https://www.google.com/too.jpg'
      const emit = { emit: { path: { var1: 'abc' }, actions: [] } }
      nui.use({ emit: { path: async () => path as any } })
      const res = await nui.createSrc(emit)
      await waitFor(() => expect(res).to.eq(path))
    })

    it(`should be able to resolve emit paths from list consumers`, async () => {
      const path = { emit: { dataKey: { var1: 'cereal.fruit' }, actions: [] } }
      nui.use({ emit: { path: async () => 'halloween.jpg' as any } })
      const listObject = [{ fruit: 'apple.jpg' }, { fruit: 'orange.jpg' }]
      createDataKeyReference({ pageObject: { info: { people: listObject } } })
      const page = nui.createPage()
      const component = await nui.resolveComponents({
        components: ui.list({
          contentType: 'listObject',
          listObject,
          iteratorVar: 'cereal',
          children: [ui.listItem({ cereal: '', children: [ui.image(path)] })],
        }),
        page,
      })
      const expectedResult = nui.getAssetsUrl() + 'halloween.jpg'
      const src = await nui.createSrc(path, { component })
      await waitFor(() => expect(src).to.eq(expectedResult))
    })
  })
})

describe(u.italic(`emit`), () => {
  describe(`type: ${u.magenta(nuiEmitType.REGISTER)}`, () => {
    it(`should pass the register object to the callback as args`, async () => {
      const spy = sinon.spy(() => Promise.resolve())
      const params = {}
      nui.use({
        register: { type: 'register', onEvent: 'myRegister' },
      })
      nui._experimental.register('myRegister', spy)
      await nui.emit({ type: 'register', event: 'myRegister', params })
      expect((spy.args[0][0 as any] as any)?.handler).to.have.property(
        'fn',
        spy,
      )
    })

    it(`should return a result back if any`, async () => {
      const data = {} as any
      const spy = sinon.spy(() => Promise.resolve(data))
      const params = {}
      nui.use({
        register: {
          type: 'register',
          onEvent: 'myRegister',
        },
      })
      nui._experimental.register('myRegister', { handler: { fn: spy } })
      const result = await nui.emit({
        type: 'register',
        event: 'myRegister',
        params,
      })
      expect(result).to.be.an('array')
      expect(result).to.have.length.greaterThan(0)
      expect(result[0]).to.eq(data)
    })
  })

  describe(`type: ${u.magenta(nuiEmitTransaction.REQUEST_PAGE_OBJECT)}`, () => {
    it(`should call the function`, async () => {
      const cbSpy = sinon.spy()
      NUI.use({
        transaction: {
          [nuiEmitTransaction.REQUEST_PAGE_OBJECT]: cbSpy,
        },
      })
      await NUI.emit({
        transaction: nuiEmitTransaction.REQUEST_PAGE_OBJECT,
        type: nuiEmitType.TRANSACTION,
      })
      expect(cbSpy).to.be.calledOnce
    })
  })
})

describe(u.italic(`getActions`), () => {
  it(`should return the map of non-builtIn actions`, () => {
    expect(NUI.getActions()).to.eq(NUI.cache.actions)
  })
})

describe(u.italic(`getBuiltIns`), () => {
  it(`should return the map of builtIn actions`, () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const spy3 = sinon.spy()
    const builtIn = {
      hello: spy1,
      abc: spy2,
      apple: spy3,
    }
    NUI.use({ builtIn })
    const builtIns = NUI.getBuiltIns()
    u.entries(builtIn).forEach(([funcName, fn]) => {
      expect(builtIns.has(funcName)).to.be.true
      expect(builtIns.get(funcName)).to.satisfy((arr: any) =>
        arr.some((obj: any) => obj.fn === fn),
      )
    })
  })
})

describe(u.italic(`getConsumerOptions`), () => {
  it(`should return the expected consumer options`, async () => {
    const page = nui.createPage()
    const component = await nui.resolveComponents({
      components: ui.divider(),
      page,
    })
    const consumerOptions = nui.getConsumerOptions({ component, page } as any)
    expect(consumerOptions).to.have.property('cache', nui.cache)
    expect(consumerOptions).to.have.property('component', component)
    expect(consumerOptions).to.have.property('context')
    expect(consumerOptions).to.have.property('createActionChain')
    expect(consumerOptions).to.have.property('createPage')
    expect(consumerOptions).to.have.property('getAssetsUrl')
    expect(consumerOptions).to.have.property('getActions')
    expect(consumerOptions).to.have.property('getBuiltIns')
    expect(consumerOptions).to.have.property('getBaseUrl')
    expect(consumerOptions).to.have.property('getBaseStyles')
    expect(consumerOptions).to.have.property('getPlugins')
    expect(consumerOptions).to.have.property('getPages')
    expect(consumerOptions).to.have.property('getPreloadPages')
    expect(consumerOptions).to.have.property('getQueryObjects')
    expect(consumerOptions).to.have.property('getRoot')
    expect(consumerOptions).to.have.property('getRootPage')
    expect(consumerOptions).to.have.property('page', page)
    expect(consumerOptions).to.have.property('resolveComponents')
    expect(consumerOptions).to.have.property('viewport', page?.viewport)
  })
})

describe(`when handling register objects`, () => {
  describe(`when emitting the register objects`, () => {
    it(`should call all the callbacks and return those results`, async () => {
      const spy = sinon.spy(async () => 'abc') as any
      const component = ui.register({
        onEvent: 'helloEvent',
        emit: ui.emit().emit as any,
      })
      nui.use({ register: component })
      const obj = nui.cache.register.get(component.onEvent as string)
      obj.callbacks = Array(4).fill(undefined).map(spy) as any
      const results = await nui.emit({ type: 'register', event: 'helloEvent' })
      expect(spy).to.have.callCount(4)
      expect(results).to.have.length(4)
      results.forEach((res) => expect(res).to.eq('abc'))
    })
  })
})

describe(u.italic(`resolveComponents`), () => {
  it(`should return component instances`, async () => {
    const page = nui.createPage({ name: 'Hello' })
    expect(
      await nui.resolveComponents({ page, components: ui.divider() }),
    ).to.be.instanceOf(Component)
  })
})

describe(u.italic(`use`), () => {
  groupedActionTypes.forEach((actionType) => {
    it(`should take { [${actionType}]: <function> }`, () => {
      const spy = sinon.spy()
      const obj = { [actionType]: spy }
      expect(NUI.cache.actions.exists(spy)).to.be.false
      nui.use(obj)
      expect(NUI.cache.actions.exists(spy)).to.be.true
    })

    it(`should take { [${actionType}]: <function>[] }`, () => {
      const spy = sinon.spy()
      const obj = { [actionType]: [spy] }
      expect(NUI.cache.actions.exists(spy)).to.be.false
      nui.use(obj)
      expect(NUI.cache.actions.exists(spy)).to.be.true
    })
  })

  describe(u.italic(`builtIn`), () => {
    const spy = sinon.spy()
    const builtIns = {
      hello: spy,
      fruit: spy,
      abc: [spy],
    }
    u.entries(builtIns).forEach(([funcName, fn]) => {
      u.array(fn).forEach((f) => {
        it(`should take { [${funcName}]: <function>[] }`, () => {
          NUI.use({ builtIn: builtIns })
          expect(NUI.cache.actions.builtIn.has(funcName)).to.be.true
          expect(NUI.cache.actions.builtIn.get(funcName)).to.satisfy(
            (arr: any) => arr.some((obj: any) => obj.fn === f),
          )
        })
      })
    })
  })

  describe(u.italic(`emit`), () => {
    const getEmits = () => NUI.getActions('emit')

    nuiTriggers.forEach((trigger: any) => {
      it(`should support { [${trigger}]: <function> }`, () => {
        const spy = sinon.spy(async () => 'hello') as any
        expect(getEmits().get(trigger)).to.have.lengthOf(0)
        NUI.use({ emit: { [trigger]: spy } })
        expect(getEmits().get(trigger)).to.have.lengthOf(1)
        expect(
          getEmits()
            .get(trigger)
            ?.some((obj) => obj.fn === spy),
        ).to.be.true
      })

      it(`should support { [${trigger}]: <function>[] }`, () => {
        const spy = sinon.spy(async () => 'hello') as any
        expect(getEmits().get(trigger)).to.have.lengthOf(0)
        NUI.use({ emit: { [trigger]: [spy] } })
        expect(getEmits().get(trigger)).to.have.lengthOf(1)
        expect(
          getEmits()
            .get(trigger)
            ?.some((obj) => obj.fn === spy),
        ).to.be.true
      })
    })
  })

  describe(u.italic(`plugin`), () => {
    it(`should set the plugin id`, async () => {
      expect(
        (
          await NUI.resolveComponents(ui.pluginBodyTail({ path: 'coffee' }))
        ).get('plugin'),
      ).to.have.property('id', 'coffee')
    })

    it(`should not do anything if the plugin was previously added`, async () => {
      expect(NUI.getPlugins('body-bottom').size).to.eq(0)
      await NUI.resolveComponents(ui.pluginBodyTail({ path: 'coffee' }))
      expect(NUI.getPlugins('body-bottom').size).to.eq(1)
      await NUI.resolveComponents(ui.pluginBodyTail({ path: 'coffee' }))
      expect(NUI.getPlugins('body-bottom').size).to.eq(1)
    })

    it(`should set the fetched plugin contents on the "content" property`, async () => {
      const component = await NUI.resolveComponents(
        ui.plugin({ path: 'coffee' } as any),
      )
      expect(component.has('content')).to.be.true
    })
  })

  it(`should use the getAssetsUrl provided function`, () => {
    expect(nui.getAssetsUrl()).not.to.eq('fafasfs')
    nui.use({ getAssetsUrl: () => 'fafasfs' })
    expect(nui.getAssetsUrl()).to.eq('fafasfs')
  })

  it(`should use the getBaseUrl provided function`, () => {
    expect(nui.getBaseUrl()).not.to.eq('fafasfs')
    nui.use({ getBaseUrl: () => 'fafasfs' })
    expect(nui.getBaseUrl()).to.eq('fafasfs')
  })

  it(`should use the getPages provided function`, () => {
    expect(nui.getPages()).not.to.eq(['fapple'])
    expect(nui.getPages()).not.to.eq('abc')
    nui.use({ getPages: () => ['apple'] })
    expect(nui.getPages()).to.deep.eq(['apple'])
  })

  it(`should use the getPreloadPages provided function`, () => {
    expect(nui.getPreloadPages()).not.to.eq(['fapple'])
    expect(nui.getPreloadPages()).not.to.eq('abc')
    nui.use({ getPreloadPages: () => ['apple'] })
    expect(nui.getPreloadPages()).to.deep.eq(['apple'])
  })

  it(`should use the getRoot provided function`, () => {
    expect(nui.getRoot()).not.to.eq(['fapple'])
    expect(nui.getRoot()).not.to.eq('abc')
    nui.use({ getRoot: () => ['apple'] })
    expect(nui.getRoot()).to.deep.eq(['apple'])
  })

  describe(u.italic(`globalRegister`), () => {
    it(`should add register components to the store`, () => {
      const component = ui.register({ onEvent: 'helloEvent' })
      nui._experimental.register(component)
      const storeObject = nui.cache.register.get(component.onEvent as string)
      expect(storeObject).to.have.property('name', 'helloEvent')
      expect(storeObject).to.have.property('fn').is.a('function')
      expect(storeObject).to.have.property('page', '_global')
    })
  })

  describe(u.italic(`register`), () => {
    it(`should support args: [<register event>, <function>]`, () => {
      const spy = sinon.spy()
      expect(NUI.cache.register.has('hello')).to.be.false
      NUI.use({ register: { hello: spy } })
      expect(NUI.cache.register.has('hello')).to.be.true
      expect(NUI.cache.register.get('hello').handler).to.have.property(
        'fn',
        spy,
      )
    })

    it(`should default the page to "_global" if it is not provided`, () => {
      expect(nui.cache.register.has('hello')).to.be.false
      const componentObject = ui.register('hello')
      nui.use({ register: componentObject })
      expect(nui.cache.register.has(componentObject.onEvent)).to.be.true
      expect(
        nui.cache.register.get(componentObject.onEvent || ''),
      ).have.property('page', '_global')
    })
  })

  describe(u.italic(`transaction`), () => {
    it(`should add the transaction to the store`, () => {
      nui.reset()
      const spy = sinon.spy()
      expect(nui.cache.transactions.has(nuiEmitTransaction.REQUEST_PAGE_OBJECT))
        .to.be.false
      nui.use({
        transaction: {
          [nuiEmitTransaction.REQUEST_PAGE_OBJECT]: spy,
        },
      })
      expect(nui.cache.transactions.get(nuiEmitTransaction.REQUEST_PAGE_OBJECT))
        .to.exist
      expect(
        nui.cache.transactions.get(nuiEmitTransaction.REQUEST_PAGE_OBJECT),
      ).to.have.property('fn', spy)
    })
  })

  describe(u.italic(u.yellow(`_experimental`)), () => {
    describe(u.magenta(`register`), () => {
      it(`should remove the default "fn" if a handler fn was provided`, () => {
        const spy = sinon.spy()
        nui.use({ register: ui.register('hello') })
        let register = nui.cache.register.get('hello')
        expect(register).to.have.property('fn').to.be.a('function')
        expect(register.handler).to.be.undefined
        nui._experimental.register('hello', spy)
        expect(register).to.have.property('fn').to.be.undefined
        expect(register.handler).not.to.be.undefined
        expect(register.handler).to.have.property('fn').eq(spy)
      })

      describe(`when giving args in the shape: [<name>, <function>]`, () => {
        it(
          `should set the fn to register.handler.fn if provided, and the ` +
            `register.fn should be undefined`,
          () => {
            const spy = sinon.spy()
            const register = nui._experimental.register('hello', spy)
            expect(register.handler).to.have.property('fn', spy)
            expect(register.fn).to.be.undefined
          },
        )

        it(`should set a default function at register.fn if a fn was not provided`, () => {
          const register = nui._experimental.register('hello', {
            page: '_global',
          })
          expect(register.handler?.fn).to.be.undefined
          expect(register.fn).to.be.undefined
        })
      })

      it(`should be able to process a register component object`, () => {
        const register = nui._experimental.register(ui.register())
        expect(register).to.exist
        expect(nui.cache.register.get(register.name)).to.eq(register)
      })

      it(`should create a "callbacks" property`, () => {
        const spy = sinon.spy()
        const register = nui._experimental.register('hello', spy)
        expect(register).to.have.property('callbacks')
      })

      it(`should initiate a default "fn" function if "handler" is not provided`, () => {
        const register = nui._experimental.register(ui.register())
        expect(register).to.have.property('fn').is.a('function')
      })

      it(`should not initiate a "fn" function if "handler" is provided`, () => {
        const spy = sinon.spy()
        const componentObject = ui.register()
        const register = nui._experimental.register(componentObject, {
          handler: { fn: spy },
        })
        expect(register.fn).to.be.undefined
        expect(register.handler).to.have.property('fn', spy)
      })

      it(`should convert emit objects to action chains`, async () => {
        const component = ui.register({
          onEvent: 'helloEvent',
          emit: ui.emit(),
        })
        const register = nui._experimental.register(component)
        expect(register.callbacks).to.have.length.greaterThan(0)
        expect(isActionChain(register.callbacks[0])).to.be.true
      })

      it(`should insert any created action chains to the callbacks list`, () => {
        const spy = sinon.spy()
        const component = ui.register({
          onEvent: 'helloEvent',
          emit: ui.emit(),
        })
        const register = nui._experimental.register(component, {
          handler: { fn: spy },
        })
        expect(register.callbacks).to.have.length.greaterThan(0)
        expect(isActionChain(register.callbacks[0])).to.be.true
      })

      xdescribe(`when handling register object's with ${u.magenta(
        'onNewEcosDoc',
      )}`, () => {
        it(`should pass the "${u.magenta(`did`)}" (${u.italic(
          `ecos document id`,
        )}) received from onNewEcosDoc to the executor handler`, async () => {
          const event = 'helloAll'
          const component = ui.register({ onEvent: event })
          nui.use({ register: component })
          const obj = nui.cache.register.get(event)
          const did = 'docId123'
          await nui.emit({ type: 'register', event, params: did } as any)
        })
      })
    })
  })

  describe(u.italic('hooks'), () => {
    describe('page', () => {
      xit(``, () => {
        //
      })
    })

    describe('setup', () => {
      xit(``, () => {
        //
      })
    })

    describe('create', () => {
      xit(`should transform the return value to a NuiComponent`, () => {
        //
      })
    })

    describe('if', () => {
      xit(``, () => {
        //
      })
    })

    describe('emit', () => {
      xit(``, () => {
        //
      })
    })

    describe('reference', () => {
      xit(``, () => {
        //
      })
    })
  })
})

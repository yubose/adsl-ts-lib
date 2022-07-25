import sinon from 'sinon'
import * as mock from 'noodl-ui-test-utils'
import * as u from '@jsmanifest/utils'
import * as nc from 'noodl-common'
import { expect } from 'chai'
import { prettyDOM } from '@testing-library/dom'
import {
  Identify,
  ComponentObject,
  EmitObjectFold,
  PageObject,
} from 'noodl-types'
import { waitFor } from '@testing-library/dom'
import {
  Component,
  createComponent,
  findIteratorVar,
  flatten,
  isListConsumer,
  NUIActionObjectInput,
  resolveAssetUrl,
} from 'noodl-ui'
import { createRender, getAllElementCount, ndom, ui } from '../test-utils'
import { cache, nui } from '../nui'
import * as i from '../utils/internal'
import * as n from '../utils'

let view: Component
let genderListObject: { key: string; value: string }[]

beforeEach(() => {
  genderListObject = [
    { key: 'Gender', value: 'Female' },
    { key: 'Gender', value: 'Male' },
    { key: 'Gender', value: 'Other' },
  ]
})

describe(u.cyan(`redraw`), () => {
  xdescribe(u.italic('state'), () => {
    let { getRoot, ndom, page, pageObject, render } = createRender({
      pageName: 'Hello',
      root: {
        Cereal: {
          formData: { username: 'moodle' },
          components: [
            ui.view({
              children: [
                ui.label({ dataKey: 'formData.username' }),
                ui.textField({
                  dataKey: 'formData.username',
                  placeholder: 'Edit username',
                }),
              ],
            }),
          ],
        },
        Hello: {
          components: [
            ui.view({
              children: [
                ui.button(),
                ui.textField({ placeholder: 'Enter name' }),
                ui.page('Cereal'),
              ],
            }),
          ],
        },
      },
    })
  })

  describe(`events`, () => {
    let id = 'hello'
    let componentObject: ComponentObject | undefined
    let currentCount = 0
    let emitObject: EmitObjectFold
    let increment = () => currentCount++
    let onClick: NUIActionObjectInput[] = []
    let pageName = 'Counter'
    let pageObject = {} as PageObject

    beforeEach(() => {
      currentCount = 0
      emitObject = ui.emitObject()
      onClick = [emitObject]
      componentObject = ui.label({
        id,
        text: null,
        dataKey: '..currentCount',
        onClick: onClick as any,
      })
      pageObject = { components: [componentObject], currentCount }
    })

    it.skip(`should still be executing action chains with the same behavior`, async () => {
      const { ndom, render } = createRender({
        pageName,
        pageObject,
        components: pageObject.components,
      })
      ndom.use({
        emit: {
          onClick: async () => {
            const node = n.findFirstByElementId(id)
            node.innerHTML = String(increment())
          },
        },
      })
      let component = await render()
      let node = n.findFirstByElementId(id)
      // TODO - fix this so that it works with only 1 click
      node.click()
      node.click()
      await waitFor(() => expect(node.textContent).to.eq('1'))
      let [_, newComp] = await ndom.redraw(node, component)
      node = _ as any
      node?.click()
      await waitFor(() => expect(node?.textContent).to.eq('2'))
      node?.click()
      node?.click()
      node?.click()
      await waitFor(() => expect(node?.textContent).to.eq('3'))
      let pair = await ndom.redraw(node, newComp)
      node = pair[0]
      newComp = pair[1]
      await waitFor(() => expect(node?.textContent).to.eq('5'))
    })
  })

  it(`should remove the components being redrawed from the component cache`, async () => {
    const { ndom, render } = createRender(
      ui.list({ listObject: genderListObject }),
    )
    const component = await render()
    const node = n.findFirstByElementId(component)
    const idsToBeRemoved = flatten(component).map((c) => c.id)
    expect(idsToBeRemoved).to.have.length.greaterThan(0)
    expect(ndom.cache.component).to.have.lengthOf(idsToBeRemoved.length)
    u.forEach(
      (child) => expect(ndom.cache.component.has(child)).to.be.true,
      component.children,
    )
    await ndom.redraw(node, component)
    u.forEach(
      (id) => expect(ndom.cache.component.has(id)).to.be.false,
      idsToBeRemoved,
    )
  })

  it(`the amount of descendants should remain the same in the components`, async () => {
    const { ndom, render } = createRender({
      components: [ui.list({ listObject: genderListObject }), ui.label()],
    })
    const list = await render()
    const node = n.findFirstByElementId(list)
    const idsToBeRemoved = flatten(list).map((c) => c.id)
    const idsToBeRemovedLengthBefore = idsToBeRemoved.length
    const [_, newComp] = await ndom.redraw(node, list)
    expect(flatten(newComp).map((c) => c.id)).to.have.length(
      idsToBeRemovedLengthBefore,
    )
  })

  it(`the DOM should structurally remain identical`, async () => {
    const iteratorVar = 'itemObject'
    const { ndom, render } = createRender({
      pageObject: {
        formData: { password: 'mypw' },
        components: [
          ui.view({
            viewTag: 'container',
            children: [
              ui.list({
                iteratorVar,
                listObject: genderListObject,
                children: [
                  ui.listItem({
                    [iteratorVar]: '',
                    children: [
                      ui.label({ dataKey: `${iteratorVar}.key` }),
                      ui.textField(`${iteratorVar}.value`),
                    ],
                  }),
                ],
              }),
              ui.label(),
              ui.view({ children: [ui.textField('formData.password')] }),
            ],
          }),
        ],
      },
    })
    const container = await render()
    const getContainerElem = () =>
      n.findBySelector('[data-viewtag=container]') as HTMLElement
    expect(getAllElementCount(`[data-viewtag=container]`)).to.eq(1)
    expect(getAllElementCount('ul')).to.eq(1)
    expect(getAllElementCount('li')).to.eq(genderListObject.length)
    expect(getAllElementCount(`[data-key="${iteratorVar}.key"]`)).to.eq(3)
    expect(getAllElementCount(`[data-key="${iteratorVar}.value"]`)).to.eq(3)
    expect(getAllElementCount(`[data-key="formData.password"]`)).to.eq(1)
    await ndom.redraw(getContainerElem(), container)
    await ndom.redraw(getContainerElem(), container)
    expect(getAllElementCount(`[data-viewtag=container]`)).to.eq(1)
    expect(getAllElementCount('ul')).to.eq(1)
    expect(getAllElementCount('li')).to.eq(genderListObject.length)
    expect(getAllElementCount(`[data-key="${iteratorVar}.key"]`)).to.eq(3)
    expect(getAllElementCount(`[data-key="${iteratorVar}.value"]`)).to.eq(3)
    expect(getAllElementCount(`[data-key="formData.password"]`)).to.eq(1)
  })

  it(`the size of the component cache should always remain the same`, async () => {
    const iteratorVar = 'itemObject'
    const listObject = genderListObject
    let { ndom, render } = createRender([
      ui.list({
        iteratorVar,
        listObject,
        children: [ui.listItem({ [iteratorVar]: '' })],
      }),
      ui.label(),
    ])
    let list = await render()
    let componentCacheLengthBefore = ndom.cache.component.length
    let listElem = n.findFirstByElementId(list)
    await waitFor(() =>
      expect(listElem.querySelectorAll('li')).to.have.lengthOf(3),
    )
    let pair = await ndom.redraw(n.findFirstByElementId(list), list)
    expect(list.blueprint.listObject).to.have.lengthOf(3)
    pair = await ndom.redraw(pair[0], pair[1])
    pair = await ndom.redraw(pair[0], pair[1])
    expect(ndom.cache.component.length).to.eq(componentCacheLengthBefore)
  })

  it(
    `should still have the same amount of children as the previous listObject` +
      ` if the data remained the same`,
    async () => {
      const iteratorVar = 'itemObject'
      const listObject = genderListObject
      let { ndom, render } = createRender([
        ui.list({
          iteratorVar,
          listObject,
          children: [
            ui.listItem({
              [iteratorVar]: '',
              children: [ui.textField(), ui.divider()],
            }),
          ],
        }),
        ui.label(),
      ])
      let list = await render()
      expect(n.findBySelector('li')).to.have.lengthOf(3)
      await ndom.redraw(n.findFirstByElementId(list), list)
      await ndom.redraw(n.findFirstByElementId(list), list)
      await ndom.redraw(n.findFirstByElementId(list), list)
      expect(u.array(n.findBySelector('li'))).to.have.lengthOf(3)
      expect(u.array(n.findBySelector('input'))).to.have.lengthOf(3)
      expect(u.array(n.findBySelector('hr'))).to.have.lengthOf(3)
    },
  )

  describe(`when redrawing select components`, () => {
    it(
      `should render more option children if the data has more items ` +
        `after redrawing`,
      async () => {
        let options = ['00:00', '00:10']
        let otherOptions = ['00:20', '00:30']
        let { render } = createRender(ui.select({ options }))
        let component = await render()
        let node = n.findFirstByElementId(component) as HTMLSelectElement
        let optionsNodes = [...node.options]
        expect(node.options).to.have.lengthOf(2)
        u.forEach(
          (optionNode, index) => expect(optionNode.value).to.eq(options[index]),
          optionsNodes,
        )
        options.push(...otherOptions)
        let result = await ndom.redraw(node, component)
        node = result[0] as HTMLSelectElement
        component = result[1]
        expect(node.options).to.have.lengthOf(4)
        for (let index = 0; index < node.options.length; index++) {
          expect(node.options[index].value).to.eq(options[index])
        }
      },
    )
  })

  it('should set the original parent as the parent of the new redrawee component', async () => {
    const view = createComponent('view')
    const list = await createRender(
      ui.list({ listObject: genderListObject }),
    ).render()
    view.createChild(list)
    ndom.draw(view)
    const listItem = list.child()
    const liNode = document.getElementById(listItem?.id || '')
    const [newLiNode, newListItem] = await ndom.redraw(liNode, listItem)
    expect(newListItem?.parent).to.eq(list)
  })

  it('should set the new component as a child on the original parent', async () => {
    const view = createComponent('view')
    const list = await createRender({
      components: [
        ui.list({
          listObject: genderListObject,
          children: [ui.listItem({ children: [ui.label()] })],
        }),
      ],
    }).render()
    view.createChild(list)
    ndom.draw(view)
    const listItem = list.child()
    const [empty, newListItem] = await ndom.redraw(null, listItem)
    await ndom.redraw(null, newListItem)
    expect(list.children.includes(newListItem)).to.be.true
  })

  it('the redrawing component + node should have a matching id', async () => {
    ndom.draw(view)
    const list = await createRender({
      components: [ui.list({ listObject: genderListObject })],
    }).render()
    const listItem = list.child()
    const liNode = document.getElementById(listItem?.id || '')
    const [newLiNode, newListItem] = await ndom.redraw(liNode, listItem)
    expect(newLiNode).to.have.property('id').eq(newListItem.id)
  })

  it.skip('should attach to the original parentNode as the new childNode', async () => {
    const view = createComponent('view')
    const { render, ndom } = createRender(
      ui.list({ listObject: genderListObject }),
    )
    const list = await render()
    view.createChild(list)
    await ndom.draw(view)
    const listItem = list.child()
    const liNode = document.getElementById(listItem?.id || '')
    const ulNode = liNode?.parentElement as HTMLUListElement
    expect(ulNode.contains(liNode)).to.be.true
    const [newNode] = await ndom.redraw(liNode, listItem)
    expect(ulNode.contains(liNode)).to.be.false
    expect(ulNode.children).to.have.length.greaterThan(0)
    expect(newNode?.parentElement.tagName).to.eq('UL')
  })

  describe('when processing path emits after redrawing', () => {
    it('should still be able to emit and update the DOM', async () => {
      let imgPath = 'selectOn.png'
      const pathSpy = sinon.spy(async () => [
        imgPath === 'selectOn.png' ? 'selectOff.png' : 'selectOn.png',
      ])
      const onClickSpy = sinon.spy(async () => {
        imgPath = imgPath === 'selectOn.png' ? 'selectOff.png' : 'selectOn.png'
        return ['']
      })
      const { ndom, render } = createRender({
        components: ui.view({
          children: [
            ui.image({
              id: 'img123',
              path: ui.emitObject(),
              onClick: [ui.emitObject()],
            }),
          ],
        }),
        on: {
          emit: {
            createActionChain: u.callAll(
              onClickSpy,
              pathSpy,
              ({ component }) => {
                imgPath = 'selectOff.png'
                component.set('data-src', nui.getAssetsUrl() + imgPath)
              },
            ),
          },
        },
      })
      ndom.use({ emit: { onClick: onClickSpy, path: pathSpy } })
      const view = await render()
      const image = view.child()
      expect(n.findFirstByElementId('img123')).to.exist
      n.findFirstByElementId('img123').click()
      await waitFor(() => {
        expect(onClickSpy).to.be.calledOnce
        expect(pathSpy).to.be.calledOnce
        expect(onClickSpy).to.be.calledOnce
      })
      await ndom.redraw(n.findFirstByElementId('img123'), image)
      n.findFirstByElementId('img123').click()
      await waitFor(() => {
        const newImg = n.findFirstByElementId('img123') as HTMLImageElement
        const expectedSrc = nui.getAssetsUrl() + imgPath
        expect(newImg.src).to.eq(expectedSrc)
      })
    })
  })

  describe('when user types something on an input node using onChange emit', () => {
    it('should still be emitting and updating the DOM', async () => {
      const mockOnChangeEmit = async (action, { component }) => {
        n.findFirstByElementId(component).setAttribute(
          'placeholder',
          component.get('data-value'),
        )
      }
      const { ndom, render } = createRender({
        pageName: 'Abc',
        pageObject: {
          components: [
            { type: 'view', children: [ui.textField('formData.password')] },
          ],
          formData: { password: 'mypassword' },
        },
      })
      ndom.use({ emit: { onChange: mockOnChangeEmit } })
      const view = await render()
      const viewElem = n.findFirstByElementId(view)
      let input = n.findFirstByDataKey('formData.password') as HTMLInputElement
      expect(input.dataset.value).to.eq('mypassword')
      expect(input.value).to.eq('mypassword')
      await ndom.redraw(viewElem, view)
      await waitFor(() => {
        expect(
          (n.findFirstByDataKey('formData.password') as HTMLInputElement)
            .dataset.value,
        ).to.eq('mypassword')
      })
    })
  })

  it('should deeply resolve the component tree down', async () => {
    const iteratorVar = 'cookie'
    const listObject = [
      { fruit: 'apple', color: 'red', path: 'flower.png' },
      { fruit: 'orange', color: 'blue', path: 'wire.png' },
    ]

    let count = 0

    const { getAssetsUrl, getRoot, ndom, pageObject, render } = createRender({
      on: {
        emit: {
          createActionChain: async ({ actionChain, component, trigger }) => {
            count++
            console.info(`[createActionChain] Called ${count} times`, {
              path: component.blueprint.path,
              trigger,
            })
            let results = []
            let result: any

            if (/(dataValue|path|placeholder)/.test(trigger)) {
              results = await actionChain?.execute?.()
              result = results.find((val) => !!val?.result)?.result

              let datasetKey = ''

              if (trigger === 'path') {
                datasetKey = 'src'
                if (!Identify.component.page(component)) {
                  result = result ? resolveAssetUrl(result, getAssetsUrl()) : ''
                  component.edit({ src: result })
                  component.edit({ 'data-src': result })
                  component.emit('path', result)
                }
              } else if (trigger === 'dataValue') {
                datasetKey = 'value'
              } else {
                datasetKey = trigger.toLowerCase()
              }
              component.edit({ [`data-${datasetKey}`]: result })
              component.emit(trigger as any, result)
            }
          },
        },
      },
      root: {
        Hello: {
          formData: { password: 'mypassword', outerImagePath: 'abc.png' },
          components: [
            ui.view({
              viewTag: 'containerTag',
              children: [
                ui.list({
                  viewTag: 'listTag',
                  listObject,
                  iteratorVar,
                  children: [
                    ui.listItem({
                      [iteratorVar]: '',
                      viewTag: 'listItemTag',
                      onClick: [ui.emitObject()],
                      children: [
                        ui.textField(`${iteratorVar}.fruit`),
                        ui.label({ dataKey: `${iteratorVar}.color` }),
                        ui.image({
                          viewTag: 'listItemImageTag',
                          path: ui.emitObject({
                            dataKey: `${iteratorVar}.path`,
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
                ui.image({ id: 'abcId', path: '..formData.outerImagePath' }),
                ui.textField('formData.email'),
                ui.view({
                  viewTag: 'viewChildTag',
                  children: [
                    ui.view({
                      children: [
                        ui.button({
                          viewTag: 'submitTag',
                          text: 'Submit',
                          onClick: [ui.emitObject()],
                        }),
                        ui.button({
                          viewTag: 'redrawTag',
                          text: 'Redraw',
                          onClick: [
                            ui.builtIn({
                              funcName: 'redraw',
                              viewTag: 'containerTag',
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
      },
    })

    ndom.use({
      builtIn: {
        redraw: async (action, opts) => {
          const viewTag = action.original.viewTag
          const node = n.findFirstByViewTag(viewTag)
          const component = cache.component.get(node?.id).component
          pageObject.formData.outerImagePath = 'brown.png'
          try {
            await ndom.redraw(node, component, ndom.findPage(opts.page))
          } catch (error) {
            console.error(error)
          }
        },
      },
      emit: {
        onClick: async (_, opts) => {
          const orig = opts.component?.blueprint as ComponentObject
          const viewTag = orig.viewTag as string
          const pageObject = opts.getRoot().Hello as PageObject
          if (viewTag === 'listItemTag') {
            const index = opts.context?.index as number
            const dataObject = listObject[index]
            dataObject.color = index + dataObject.color
            dataObject.fruit = index + dataObject.fruit
            dataObject.path = index + dataObject.path
          } else if (viewTag === 'submitTag') {
            pageObject.formData.email = 'aitmed@gmail.com'
            pageObject.formData.password = 'updatedPassword'
          }
        },
        path: async (_, opts) => {
          const orig = opts.component?.blueprint as ComponentObject
          const viewTag = orig.viewTag as string
          if (viewTag === 'listItemImageTag') {
            return [listObject[opts.context?.index].path]
          }
          return pageObject.formData.outerImagePath
        },
      },
    })

    let view = await render()
    let list = view.child()

    let initialState = {
      container: {
        childCount: view.length,
      },
      list: {
        listObject,
        childCount: list.length,
      },
      listItem1: {
        textField: { 'data-value': listObject[0].fruit },
        label: { 'data-value': listObject[0].color },
        image: { 'data-src': `${getAssetsUrl()}flower.png` },
      },
      listItem2: {
        textField: { 'data-value': listObject[1].fruit },
        label: { 'data-value': listObject[1].color },
        image: { 'data-src': `${getAssetsUrl()}wire.png` },
      },
      logoImage: {
        'data-src': `${getAssetsUrl()}logo.png`,
      },
      textField: {
        'data-value': 'mypassword',
      },
      submitButton: {
        text: 'Submit',
      },
    }

    let containerElem = n.findFirstByElementId(view.id) as HTMLDivElement
    let listItemElems = n.findBySelector('li') as HTMLLIElement[]
    let [liElem1] = listItemElems
    let redrawButtonElem = n.findFirstByViewTag('redrawTag')
    let containerImageElem = n.findFirstByElementId('abcId')

    const getListItemDataElems = (liElem: HTMLLIElement) => ({
      textField: liElem.querySelector('input'),
      label: liElem.querySelector(`[data-name="color"]`),
      image: liElem.querySelector('img'),
    })

    expect(containerElem)
      .to.have.property('children')
      .with.lengthOf(initialState.container.childCount)
    expect(listItemElems).to.not.be.empty
    expect(listItemElems).to.have.lengthOf(listObject.length)
    expect(containerImageElem).to.exist

    await waitFor(() => {
      expect(containerImageElem).to.have.property(
        'src',
        getAssetsUrl() + 'abc.png',
      )
      for (let index = 0; index < 2; index++) {
        const children = getListItemDataElems(
          (n.findBySelector('li') as HTMLLIElement[])[index],
        )
        expect(children.textField).to.have.property(
          'value',
          listObject[index].fruit,
        )
        expect(children.label).to.have.property(
          'textContent',
          listObject[index].color,
        )
        expect(children.image).to.have.property(
          'src',
          getAssetsUrl() + listObject?.[index].path,
        )
      }
    })

    liElem1.click()
    redrawButtonElem.click()

    expect(containerElem)
      .to.have.property('children')
      .with.lengthOf(initialState.container.childCount)
    expect(listItemElems).to.not.be.empty
    expect(listItemElems).to.have.lengthOf(listObject.length)

    await waitFor(() => {
      for (let index = 0; index < 2; index++) {
        const children = getListItemDataElems(
          (n.findBySelector('li') as HTMLLIElement[])[index],
        )
        expect(children.textField).to.have.property(
          'value',
          listObject[index].fruit,
        )
        expect(children.label).to.have.property(
          'textContent',
          listObject[index].color,
        )
        expect(children.image).to.have.property(
          'src',
          getAssetsUrl() + listObject[index].path,
        )
      }

      // TODO - This part is failing
      // expect(n.findFirstByElementId('abcId')).to.have.property(
      //   'src',
      //   getAssetsUrl() + 'brown.png',
      // )
    })
  })

  it('should structurally remain the same in the dom', async () => {
    const pathSpy = sinon.spy(async () => 'food.png')
    const onClickSpy = sinon.spy(async () => [''])
    const iteratorVar = 'hello'
    const pageObject = {
      formData: { password: 'mypassword' },
      components: [
        ui.view({
          children: [
            ui.list({
              listObject: genderListObject,
              children: [
                ui.listItem({
                  children: [
                    ui.textField({ dataKey: 'formData.password' }),
                    ui.label({ dataKey: `${iteratorVar}.fruit` }),
                    ui.image({
                      path: ui.emitObject(),
                      onClick: [ui.emitObject()],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    } as PageObject

    const { ndom, render } = createRender({ root: { Hello: pageObject } })
    ndom.use({ emit: { path: pathSpy as any, onClick: onClickSpy } })
    await render()

    expect(n.findBySelector('ul')).to.be.instanceOf(HTMLUListElement)
    expect(n.findBySelector('li')).to.have.lengthOf(3)
    expect(n.findBySelector('img')).to.have.lengthOf(3)
    expect(n.findBySelector('input')).to.have.lengthOf(3)
    const componentId = n.findFirstBySelector('li').id
    await waitFor(() => {
      expect(n.findFirstBySelector('input').dataset.value).to.eq('mypassword')
    })
    await ndom.redraw(
      n.findFirstBySelector('li'),
      ndom.cache.component.get(componentId).component,
    )
    expect(u.array(n.findBySelector('ul'))).to.have.lengthOf(1)
    await waitFor(() => {
      expect(u.array(n.findBySelector('li'))).to.have.lengthOf(3)
    })
    expect(u.array(n.findBySelector('img'))).to.have.lengthOf(3)
    expect(u.array(n.findBySelector('input'))).to.have.lengthOf(3)
    expect(n.findFirstBySelector('input').dataset).to.have.property(
      'value',
      'mypassword',
    )
  })

  describe(`when redrawing page components`, () => {
    let root: {
      Apple: PageObject
      Cereal: PageObject
      Hello: PageObject
      Keychain: PageObject
      Tiger: PageObject
      Zoo: PageObject
    }

    beforeEach(() => {
      root = {
        Apple: { components: [ui.divider(), ui.button('Click me')] },
        Cereal: {
          formData: { password: '123' },
          components: [
            ui.image('abc.png'),
            ui.label({ dataKey: 'formData.password' }),
            ui.popUpComponent('cerealPopUpView'),
          ],
        },
        Keychain: {
          myData: { firstName: 'Athena' },
          components: [
            ui.label('where is my keychain?'),
            ui.button({ text: 'Click', viewTag: 'keychainButtonTag' }),
          ],
        },
        Hello: {
          pageName: 'Tiger',
          components: [
            ui.view({
              viewTag: 'abcTag',
              children: [
                ui.page({
                  path: { if: [true, '..pageName', '..pageName'] },
                  style: {
                    width: '0.2',
                    height: '0.2',
                    top: '0.1',
                    right: '0.1',
                    shadow: 'true',
                  },
                }),
              ],
            }),
            ui.button({
              id: 'redrawButton',
              onClick: [ui.builtIn({ funcName: 'redraw', viewTag: 'abcTag' })],
            }),
          ],
        },
        Tiger: { components: [ui.popUpComponent('myPopUpView')] },
        Zoo: { components: [ui.view({ children: [ui.scrollView()] })] },
      }
    })

    it.skip(`should not be resetting the iframe's styles`, async () => {
      const { getRoot, ndom, render } = createRender({
        pageName: 'Hello',
        root,
      })
      await render()
      let redrawButton = n.findFirstByElementId('redrawButton')
      let pageEl = n.findFirstByClassName('page')

      // console.info(pageEl.contentDocument.body.style)
    })

    xit(
      `should remove elements from a previous redraw when ` +
        `redrawing simultaneously`,
      async function () {
        const { getRoot, ndom, render } = createRender({
          pageName: 'Hello',
          root,
        })

        const rerender = (pageName = '', keychainDataKeyVal = '') => {
          getRoot().Hello.pageName = pageName
          keychainDataKeyVal && (getRoot().Keychain.myData = keychainDataKeyVal)
          redrawButton.click()
        }

        ndom.use({
          builtIn: {
            redraw: async (_) => {
              setTimeout(() => {
                let viewTag = _.original.viewTag
                let node = n.findFirstByViewTag(viewTag)
                ndom.redraw(node, i._getComponentFromCache(node.id))
              }, 50)
            },
          },
          evalObject: async () => {},
          saveObject: () => new Promise((r) => setTimeout(r, 100)),
          getPages: () => ['Apple', 'Cereal', 'Hello', 'Keychain', 'Tiger'],
        })

        let pageEl: HTMLIFrameElement
        let redrawButton: HTMLButtonElement

        await render()
        redrawButton = n.getFirstByElementId('redrawButton')
        rerender('Apple')
        rerender('Cereal', 'fruit')
        rerender('Keychain')
        rerender('Zoo')
        rerender('Apple', 'paper')
        rerender('Apple')
        rerender('Zoo', 'worldwideweb')
        rerender('Keychain')

        await waitFor(() => {
          pageEl = n.findFirstByClassName('page') as HTMLIFrameElement
          const pageBody = pageEl.contentDocument.body
          expect(pageBody).to.have.property('children').to.have.lengthOf(2)
        })

        await waitFor(() => {
          const labelEl = n.findFirstByDataKey('myData.firstName')
          expect(labelEl).to.exist
          const buttonEl = n.findFirstByViewTag('keychainButtonTag')
          expect(buttonEl).to.exist
        })
      },
    )

    xit(
      `should abort rendering to the DOM of the previous redraw when ` +
        `redrawing the same page twice`,
      async function () {
        //
      },
    )

    xit(`should not leak any page component elements to the root DOOM`, async function () {
      //
    })
  })
})

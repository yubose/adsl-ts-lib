import { expect } from 'chai'
import sinon from 'sinon'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { ComponentObject, PageObject } from 'noodl-types'
import { Page as NuiPage } from 'noodl-ui'
import * as u from '@jsmanifest/utils'
import * as nc from 'noodl-common'
import { event as nuiEvent, NuiComponent } from 'noodl-ui'
import { getRenderProps, createRender, ui } from '../../utils/test-utils'
import {
  findBySelector,
  findByViewTag,
  findFirstByElementId,
  findFirstBySelector,
  findFirstByViewTag,
} from '../../dom/utils'
import cache from '../../_cache'
import ComponentPage from '../../dom/factory/componentFactory/ComponentPage'
import * as i from '../../utils/internal'
import * as n from '../../dom/utils'
import type NDOMPage from '../../Page'

const _createRender: any = () => {}
const render = createRender()

describe(nc.coolGold('components'), () => {
  describe(nc.italic(`Page`), () => {
    let Donut: PageObject
    let Cereal: PageObject
    let Hello: PageObject
    let formData = { password: 'fruits' }
    let submitMessage = 'Press submit to proceed'
    let listData = [
      { firstName: 'Mike', gender: 'Male' },
      { firstName: 'Lisa', gender: 'Feale' },
      { firstName: 'Brit', gender: 'Female' },
    ] as const

    beforeEach(() => {
      Donut = {
        formData: { ...formData, fullName: 'Mark Twain' },
        components: [
          {
            type: 'view',
            id: 'donutContainer',
            viewTag: 'donutContainer',
            children: [
              ui.textField({
                id: 'donutInput',
                onChange: [
                  ui.emitObject({
                    dataKey: 'Donut.formData.password',
                  }) as any,
                ],
              }),
              ui.button({
                id: 'b',
                text: `Go to Donut page`,
                onClick: [ui.goto('Donut')],
              }),
              ui.divider({ id: 'divider' }),
              ui.label({
                id: 'label',
                text: '..fullName',
              }),
            ],
          },
        ],
      }
      Cereal = {
        submitMessage,
        components: [
          ui.view({
            viewTag: 'cerealView',
            children: [
              ui.image('abc.png'),
              ui.label({ dataKey: 'submitMessage' }),
              ui.button({ text: 'Submit' }),
            ],
          }),
        ],
      }
      Hello = {
        greeting: 'good morning',
        fullName: 'Chris Tran',
        listData,
        components: [
          {
            id: 'container',
            type: 'view',
            style: { shadow: 'true' },
            children: [
              ui.textField({
                id: 'tf',
                dataKey: 'Hello.greeting',
                placeholder: 'Say your greeting',
              } as any),
              {
                type: 'view',
                id: 'pageParent',
                children: [
                  ui.page({
                    id: 'page123',
                    path: 'Donut',
                    children: [],
                    style: {
                      fontColor: '0x555555',
                      width: '0.2',
                      height: '0.2',
                      left: '0',
                      top: '0.2',
                      shadow: 'true',
                    },
                  }),
                ],
              },
            ],
          },
        ],
      }
    })

    function createRender(
      opts?: Omit<Parameters<typeof _createRender>[0], 'root'> & {
        root?:
          | Record<string, any>
          | ((currentRoot: Record<string, any>) => Record<string, any>)
      },
    ) {
      const currentRoot = { Cereal, Donut, Hello }
      const renderer = _createRender({
        ...opts,
        root: u.isFnc(opts?.root) ? opts?.root(currentRoot) : currentRoot,
      })
      renderer.nui.use({
        getPages: () => u.keys(renderer.getRoot()),
      })
      return renderer
    }

    it.only(`should use the NuiPage instance from the page component to initialize the constructor`, async () => {
      const { ndom, render } = createRender(
        ui.view({ children: [ui.page('Donut')] }),
      )
      const viewComponent = await render()
      const pageComponent = viewComponent.child()
      const nuiPage = pageComponent.get('page') as NuiPage
      const componentPage = new ComponentPage(pageComponent)
      expect(componentPage).to.have.property('created').to.eq(nuiPage.created)
    })

    it(`should set the component id to global pages`, async () => {
      const { ndom, render } = createRender()
      await render()
      await waitForPageChildren()
      const node = n.findFirstByClassName('page') as HTMLIFrameElement
      const component = ndom.cache.component.get(node.id).component
      expect(ndom.global.pages).to.have.property(component.id)
      expect(ndom.global.pages[component.id]).to.be.instanceOf(ComponentPage)
    })

    it(`should attach the component styles onto the iframe`, async () => {
      const { getRoot, nui, ndom, render } = _createRender({
        pageName: 'Hello',
        pageObject: Hello,
        root: { Cereal, Donut, Hello },
      })
      nui.use({
        getPages: () => ['Cereal', 'Donut', 'Hello'],
      })
      const viewComponent = await render()
      const pageComponent = viewComponent.child(1).child()
      await waitForPageChildren()
      const node = n.findFirstByClassName('page') as HTMLIFrameElement
      expect(node.style).to.have.property('fontColor', '#555555')
      expect(node.style).to.have.property(
        'boxShadow',
        '5px 5px 10px 3px rgba(0, 0, 0, 0.015)',
      )
      expect(node.style).to.have.property('width', '75.00px')
      expect(node.style).to.have.property('height', '133.40px')
      expect(node.style).to.have.property('top', '133.40px')
      expect(node.style).to.have.property('left', '0px')
      expect(node.style).to.have.property('margin-top', '0px')
    })

    it.skip(`should clear all old elements from the DOM and render all new elements to the DOM from the page object`, async () => {
      const redrawSpy = sinon.spy()
      const {
        getRoot,
        render: renderProp,
        nui,
      } = _createRender({
        pageName: 'Hello',
        pageObject: {
          formData: { password: 'fruits' },
          infoPage: 'Donut',
          components: [
            ui.view({
              viewTag: 'containerTag',
              children: [
                ui.scrollView({
                  viewTag: 'scrollTag',
                  onClick: [ui.builtIn('redraw')],
                  children: [
                    ui.textField('formData.password'),
                    ui.page({
                      id: 'page123',
                      path: { if: [true, '..infoPage', '..infoPage'] },
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
        root: {
          Cereal,
          Donut: {
            ...Donut,
            components: [
              { ...Donut.components[0], viewTag: 'donutContainerTag' },
              ...Donut.components.slice(1),
            ],
          },
        },
      })

      nui.use({
        builtIn: {
          redraw: async (a, o) => {
            try {
              const el = findByViewTag(a.original.viewTag) as HTMLElement
              const comp = cache.component.get(el.id).component
              getRoot().Hello.infoPage = 'Cereal'
              redrawSpy(a, o)
              await ndom.redraw(el, comp)
            } catch (error) {
              console.error(error)
              throw error
            }
          },
        },
        emit: {
          onChange: async () => {
            try {
              getRoot().Donut.formData.password = 'abc123'
            } catch (error) {
              console.error(error)
              throw error
            }
          },
        },
        getPages: () => ['Cereal', 'Donut', 'Hello'],
      })

      await renderProp()
      expect(getRoot().Donut.formData).to.have.property('password', 'fruits')

      const getHelloPageElems = () => {
        const container = findFirstByViewTag('containerTag') as HTMLElement
        const scrollViewEl = container?.firstElementChild
        const textFieldEl = scrollViewEl?.firstElementChild
        const pageEl = textFieldEl?.nextElementSibling as HTMLIFrameElement
        return { container, scrollViewEl, textFieldEl, pageEl }
      }

      const getDonutPageElems = () => {
        const container = findFirstByViewTag('donutContainerTag') as HTMLElement
        const textFieldEl = container?.firstElementChild as HTMLInputElement
        const buttonEl = textFieldEl?.nextElementSibling as HTMLElement
        const dividerEl = buttonEl?.nextElementSibling as HTMLElement
        const labelEl = dividerEl?.nextElementSibling as HTMLElement
        return { container, textFieldEl, buttonEl, dividerEl, labelEl }
      }

      const getCerealPageElems = () => {
        const container = findFirstByViewTag('cerealView') as HTMLElement
        const imgEl = container?.firstElementChild as HTMLImageElement
        const labelEl = imgEl?.nextElementSibling as HTMLElement
        const buttonEl = labelEl?.nextElementSibling as HTMLButtonElement
        return { container, imgEl, labelEl, buttonEl }
      }

      let helloPageElems: ReturnType<typeof getHelloPageElems> | undefined
      let donutPageElems: ReturnType<typeof getDonutPageElems>
      let cerealPageElems: ReturnType<typeof getCerealPageElems>

      await waitFor(() => {
        helloPageElems = getHelloPageElems()
        u.values(helloPageElems).forEach((elem) => expect(elem).to.exist)
        donutPageElems = getDonutPageElems()
        u.values(donutPageElems).forEach((elem) => expect(elem).to.exist)
      })
      ;(helloPageElems?.scrollViewEl as HTMLElement).click()

      await waitFor(() => {
        let pageComp = cache.component.get(helloPageElems?.pageEl.id).component
        expect(redrawSpy).to.be.calledOnce
        expect(pageComp.get('path')).to.eq('Cereal')
      })

      await waitFor(() => {
        cerealPageElems = getCerealPageElems()
        // console.info(getRoot())
        console.info(
          prettyDOM(findFirstBySelector('#page123')?.contentDocument?.body),
        )
        expect(cerealPageElems.container).to.exist
        // u.forEach((elem) => expect(elem).to.exist, u.values(cerealPageElems))
        // expect(cerealPageElems.imgEl.dataset).to.have.property(
        //   'src',
        //   `${assetsUrl}abc.png`,
        // )
        // expect(cerealPageElems.imgEl).to.have.property(
        //   'src',
        //   `${assetsUrl}abc.png`,
        // )
        // expect(cerealPageElems.labelEl.textContent).to.eq(submitMessage)
      })
    })

    it(`should set initialized to true when 'load' event is fired`, async () => {
      const { render } = createRender()
      await render()
      await waitFor(() => {
        expect(
          n.findFirstByClassName('page') as HTMLIFrameElement,
        ).to.be.instanceOf(HTMLIFrameElement)
      })
    })

    it(`should be an iframe and in the DOM`, async () => {
      const { render } = createRender()
      await render()
      await waitFor(() => {
        expect(
          findFirstByElementId('page123') as HTMLIFrameElement,
        ).to.be.instanceOf(HTMLIFrameElement)
      })
    })

    it(`should render the component children to the DOM when received`, async () => {
      const { render } = createRender()
      await render()
      await waitFor(() => {
        const pageElem = findFirstByElementId('page123') as HTMLIFrameElement
        const pageElemBody = pageElem?.contentDocument?.body
        expect(pageElemBody).to.exist
        expect(pageElemBody?.childElementCount).to.be.greaterThan(0)
        expect(findFirstByElementId('donutInput')).to.exist
      })
    })

    it(`should have the same pages in NDOM global as the amount of pages in the NUI page cache`, async () => {
      const { ndom, render } = _createRender({
        pageName: 'Hello',
        root: {
          Donut: {
            components: [ui.view({ children: [ui.button(), ui.label()] })],
          },
          Hello: { components: [ui.view({ children: [ui.page('Donut')] })] },
        },
      })
      ndom.use({ getPages: () => ['Donut', 'Hello'] })
      await render()
      // const pageComponent = view.child()
      await waitFor(() => {
        // const componentPage = ndom.findPage(pageComponent)
        // expect(componentPage).to.exist
        // expect(componentPage?.body).to.exist
        // expect(componentPage.body)
        //   .to.have.property('children')
        //   .to.have.length.greaterThan(0)
        expect(u.keys(ndom.pages)).to.have.lengthOf(cache.page.length)
      })
    })

    it(`should still render an empty iframe if path is an empty string`, async () => {
      const { render } = createRender({
        root: (currentRoot) => {
          currentRoot.Hello.components[0].children[1].children[0].path = ''
          return currentRoot
        },
      })
      await render()
      await waitFor(() => {
        const pageElem = findBySelector('page') as HTMLIFrameElement
        expect(pageElem?.contentDocument?.body).to.exist
      })
    })

    it(`should still set the NDOM page to global pages if path is an empty string`, async () => {
      const { render } = createRender({
        root: (currentRoot) => {
          currentRoot.Hello.components[0].children[1].children[0].path = ''
          return currentRoot
        },
      })
      await render()
      await waitFor(() => {
        const pageElem = findBySelector('page') as HTMLIFrameElement
        const pageElemBody = pageElem?.contentDocument?.body
        expect(pageElemBody?.childElementCount).to.eq(0)
      })
      await waitFor(() =>
        expect(ndom.global.pageIds).to.have.lengthOf(cache.page.length),
      )
    })

    it(
      `should immediately re-render if its page name is set to a different ` +
        `one and PAGE_CHANGED is emitted`,
      async () => {
        const getPageElem = () =>
          document.getElementsByClassName('page')[0] as HTMLIFrameElement
        const getPageElemBody = () =>
          getPageElem().contentDocument?.body as HTMLBodyElement
        const { render } = createRender()
        await render()
        await waitForPageChildren()
        expect(getPageElemBody().children[0].children[0]).to.eq(
          findFirstByElementId('donutInput'),
        )
        const component = cache.component.get('page123').component
        const ndomPage = ndom.findPage(component.get('page') as NuiPage)
        ndomPage && (ndomPage.requesting = 'Tiger')
        component.emit(nuiEvent.component.page.PAGE_CHANGED)
        await waitForPageChildren()
        expect(getPageElemBody())
          .to.have.property('childElementCount')
          .greaterThan(0)
        await waitFor(() => {
          expect(getPageElemBody().children[0] as HTMLElement)
            .to.have.property('tagName')
            .not.to.eq('INPUT')
          expect(getPageElemBody().children[0])
            .to.have.property('children')
            .with.lengthOf(4)
        })
      },
    )

    describe(nc.italic('component cache'), () => {
      let _counter = 0
      let _ids = [] as number[]

      const getPageElem = () =>
        findFirstByElementId('page123') as HTMLIFrameElement

      const getRoot = (currentRoot?: Record<string, any>) => ({
        Tiger: {
          components: [
            {
              type: 'view',
              id: 'tigerView',
              children: [
                ui.scrollView({
                  id: 'tigerScrollView',
                  children: [
                    ui.button({
                      id: 'tigerButton',
                      text: 'Submit',
                    }),
                  ],
                }),
              ],
            },
          ],
        },
        Cereal: {
          components: [
            createWithIdIncrementer({
              id: 'cereal-grandparent',
              type: 'view',
              children: [
                createWithIdIncrementer({
                  type: 'view',
                  children: [
                    createWithIdIncrementer(
                      ui.button({
                        children: [
                          createWithIdIncrementer(
                            ui.scrollView({
                              children: [
                                createWithIdIncrementer(
                                  ui.scrollView({
                                    children: [
                                      createWithIdIncrementer(
                                        ui.textField({
                                          placeholder: 'Enter name',
                                          id: 'cereal-last-child',
                                        } as any),
                                      ),
                                    ],
                                  }),
                                ),
                              ],
                            }),
                          ),
                        ],
                      }),
                    ),
                    createWithIdIncrementer(ui.textField()),
                    createWithIdIncrementer(ui.textView()),
                    createWithIdIncrementer(ui.label('morning')),
                    createWithIdIncrementer(ui.button()),
                    createWithIdIncrementer(ui.image('abc.png')),
                    createWithIdIncrementer(
                      ui.divider({ id: 'cereal-divider' }),
                    ),
                  ],
                }),
              ],
            }),
          ],
        },
        ...currentRoot,
      })

      const createWithIdIncrementer = (obj: ComponentObject) => {
        _ids.push(++_counter)
        return { ...obj, id: _counter } as ComponentObject
      }

      describe(`syncing with component cache`, () => {
        function getCreateRenderOptions({
          targetPage = 'Cereal',
          ...opts
        }: Record<string, any> = {}) {
          return {
            pageName: 'Hello',
            root: (c) => ({
              ...c,
              ...getRoot({
                Hello: {
                  components: [
                    { id: 'p1', type: 'view', children: [ui.label()] },
                    { id: 'p2', type: 'view', children: [ui.page(targetPage)] },
                  ],
                },
              }),
            }),
            ...opts,
          }
        }

        async function changeToTigerPage(
          ndomPage: NDOMPage,
          component: NuiComponent.Instance,
        ) {
          if (!ndomPage) return
          ndomPage.page = 'Tiger'
          ndomPage.requesting = 'Tiger'
          return component.emit(nuiEvent.component.page.PAGE_CHANGED)
        }

        it(`should add all the page descendant children to the component cache`, async () => {
          const { render } = createRender(getCreateRenderOptions())
          await render()
          const view2 = cache.component.get('p2').component
          const pageComponent = view2.child()
          await waitForPageChildren()
          const expectedCurrentComponentCount = 16

          await waitFor(() => {
            expect(
              findFirstByElementId(pageComponent).contentDocument.body.children,
            )
              .to.have.property('length')
              .greaterThan(0)
          })

          expect(cache.component.length).to.eq(expectedCurrentComponentCount)
          const pageChildrenIds = getDescendantIds(pageComponent)
          const cachedComponentIds = [...cache.component.get().values()].map(
            (obj) => obj.component.id,
          )
          expect(pageChildrenIds).to.satisfy(() =>
            pageChildrenIds.every((id) => cachedComponentIds.includes(id)),
          )
        })

        it.skip(`should remove all the previous descendant page children from the component cache`, async () => {
          const { ndom, render } = createRender(getCreateRenderOptions())
          await render()
          const pageComponent = cache.component.get('p2').component.child()
          const componentPage = ndom.findPage(pageComponent)
          await waitForPageChildren()
          const oldPageChildrenIds = getDescendantIds(pageComponent)
          oldPageChildrenIds.forEach((id) => {
            expect(cache.component.get(id)).to.exist
          })
          oldPageChildrenIds.forEach((id) =>
            console.info(cache.component.get(id).page),
          )
          componentPage.requesting = 'Tiger'
          await ndom.render(componentPage, {})
          console.info(oldPageChildrenIds)
          await waitFor(() => {
            oldPageChildrenIds.forEach((id) => {
              expect(cache.component.get(id)).to.not.exist
            })
          })
        })

        it(
          `should not have additional components in the cache that have ` +
            `their page set to the page component's target page after resolving`,
          async () => {
            let { getRoot, render } = createRender(
              getCreateRenderOptions({ targetPage: 'Tiger' }),
            )
            await render()
            await waitForPageChildren()
            let pageComponent = cache.component.get('p2').component.child()
            let ndomPage = ndom.findPage(pageComponent.get('page') as NuiPage)
            await changeToTigerPage(ndomPage, pageComponent)
            await waitForPageChildren()
            pageComponent = cache.component.get('p2').component.child()

            await waitFor(() => {
              const ids = getDescendantIds(pageComponent)
              expect(ids).to.have.lengthOf(3)
              expect(ids).to.have.all.members([
                'tigerView',
                'tigerScrollView',
                'tigerButton',
              ])
            })
          },
        )
      })
    })

    it(`should render normally as with non page components`, async () => {
      const listObject = [
        { greeting: 'good morning', btnText: 'Click' },
        { greeting: 'good bye', btnText: 'Dont click' },
      ]
      const { render } = createRender({
        root: (currRoot) => ({
          ...currRoot,
          Donut: {
            components: [
              ui.view({
                id: 'container',
                children: [
                  ui.divider(),
                  ui.list({
                    iteratorVar: 'itemObject',
                    listObject,
                    children: [
                      ui.listItem({
                        children: [
                          ui.textField('itemObject.greeting'),
                          ui.label({ dataKey: 'itemObject.btnText' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
        }),
        components: [ui.view({ children: [ui.page('Donut')] })],
      })
      let viewComponent = await render()
      let pageComponent = viewComponent.child()
      let pageEl = findFirstByElementId(pageComponent) as HTMLIFrameElement
      let pageBodyEl: HTMLBodyElement

      expect(pageEl).to.exist
      expect(pageEl).to.be.instanceOf(HTMLIFrameElement)

      await waitFor(() => {
        expect((pageBodyEl = pageEl.contentDocument.body as HTMLBodyElement))
          .to.have.property('children')
          .with.lengthOf(1)
      })

      const containerEl = pageBodyEl.firstChild as HTMLDivElement
      expect(containerEl).to.have.property('children').with.lengthOf(2)
      expect(containerEl.firstChild).to.have.property('tagName', 'HR')
      expect(containerEl.childNodes.item(1)).to.have.property('tagName', 'UL')
      const listEl = containerEl.querySelector('ul') as HTMLUListElement
      expect(listEl).to.have.property('children').lengthOf(listObject.length)
      listObject.forEach((obj, index) => {
        const listItemEl = listEl.childNodes.item(index) as HTMLLIElement
        expect(listItemEl).to.have.property('children').lengthOf(2)
        expect(listItemEl.firstChild).to.have.property('tagName', 'INPUT')
        expect(listItemEl.lastChild).to.have.property('tagName', 'DIV')
        const inputEl = listItemEl.querySelector('input') as HTMLInputElement
        const labelEl = listItemEl.querySelector('div') as HTMLDivElement
        expect(inputEl).to.have.property('value', obj.greeting)
        expect(labelEl).to.have.property('innerHTML', obj.btnText)
      })
    })

    it(`should not duplicate any children`, async () => {
      const { getRoot, page, pageObject, render } = createRender({
        components: [ui.view({ children: [ui.page('Donut')] })],
      })
      const view = await render()
      const pageComponent = view.child()
      await waitFor(() => {
        const pageNode = findFirstByElementId(
          pageComponent,
        ) as HTMLIFrameElement
        const pageBody = pageNode?.contentDocument?.body
        expect(pageBody).to.exist
        expect(pageBody?.childElementCount).to.eq(
          getRoot().Donut.components.length,
        )
        expect(pageBody)
          .to.have.property('childNodes')
          .to.have.length(getRoot().Donut.components.length)
      })
    })

    describe(`when rendering through absolute/remote urls (http*)`, () => {
      xit(`should create an NDOM page using the PageComponent`, () => {
        //
      })

      xit(`should create a new NDOM PageComponent if not created yet`, () => {
        //
      })

      xit(`should reuse existing NDOM PageComponent if the URL is the same as one found in the global map`, () => {
        //
      })

      xit(`should not reuse but create a new NDOM PageComponent if rendering additional components with the same URL`, () => {
        //
      })

      xit(`should listen for postMessage messages`, () => {
        //
      })

      xit(`should be able to receive messages from inside the iframe`, () => {
        //
      })

      xit(`should be able to send messages to the parent window from within the iframe`, () => {
        //
      })

      describe(`when using postMessage emit`, () => {
        xit(`should use the object received from postMessage as the data object`, () => {
          //
        })

        xit(`should invoke the postMessage action chain when receiving a message inside of the remote page`, () => {
          //
        })
      })

      xit(`should listen on the onload event if it is not loaded yet`, () => {
        //
      })

      xit(`should immediately fire custom onload events if the element is already loaded into the DOM`, () => {
        //
      })
    })
  })

  describe(nc.italic(`textField`), () => {
    it(`should initialize value with data-value on load`, async () => {
      const { render } = _createRender({
        root: {
          Hello: {
            formData: { password: 'pw123' },
            components: [ui.textField('formData.password')],
          },
        },
      })
      const textField = await render()
      const input = findFirstByElementId(textField)
      expect(input.dataset).to.have.property('value', 'pw123')
      expect(input).to.have.property('value', 'pw123')
    })
  })

  describe(nc.italic(`select`), () => {
    it(`should not have an extra item in options`, async () => {
      const genders = ['2020', '2021', '2022']
      const { render } = _createRender({
        pageName: 'F',
        components: ui.select({
          options: ['2020', '2021', '2022'],
          viewTag: 'selectTag',
        }),
      })
      const component = await render()
      const node = findFirstByElementId(component)
      const select = document.getElementById(node.id)
      await waitFor(() => {
        expect(select.childNodes.length).to.equal(3)
      })
    })
  })

  describe(nc.italic(`list`), () => {
    it(`load double list`, async () => {
      const listData = [
        { key: 'A', data: [{ key: 'apple' }, { key: 'appointment' }] },
        { key: 'B', data: [{ key: 'banana' }, { key: 'banner' }] },
        { key: 'C', data: [{ key: 'China' }, { key: 'chaos' }] },
      ]
      const { render } = _createRender({
        root: {
          Hello: {
            formData: {
              listData,
            },
            components: [
              ui.view({
                children: [
                  ui.list({
                    iteratorVar: 'itemObject',
                    contentType: 'listObject',
                    listObject: [
                      {
                        key: 'A',
                        data: [{ key: 'apple' }, { key: 'appointment' }],
                      },
                      {
                        key: 'B',
                        data: [{ key: 'banana' }, { key: 'banner' }],
                      },
                      { key: 'C', data: [{ key: 'China' }, { key: 'chaos' }] },
                    ],
                    children: [
                      ui.listItem({
                        itemObject: '',
                        children: [
                          ui.label({ dataKey: 'itemObject.key' }),
                          ui.list({
                            iteratorVar: 'itemObject',
                            contentType: 'listObject',
                            listObject: 'itemObject.data',
                            // viewTag: 'secondListTag',
                            children: [
                              ui.listItem({
                                itemObject: '',
                                children: [
                                  ui.label({ dataKey: 'itemObject.key' }),
                                ],
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
      const component = await render()
      const node = findFirstByElementId(component)
      const ulList = node.getElementsByTagName('ul')
      await waitFor(() => {
        expect(ulList.length).to.eq(4)
      })
    })
  })

  describe(`video`, () => {
    it(`should set the poster (cover image)`, async () => {
      const { assetsUrl, render } = _createRender(
        ui.video({ poster: 'abc.png' }),
      )
      const el = findFirstByElementId(await render()) as HTMLVideoElement
      expect(el).to.have.property('poster', `${assetsUrl}abc.png`)
    })

    it(`should set the src`, async () => {
      const { assetsUrl, render } = _createRender(
        ui.video({ path: 'twenty.jpeg' }),
      )
      const el = findFirstByElementId(await render()) as HTMLVideoElement
      await waitFor(() => {
        expect(el).to.have.property('src', `${assetsUrl}twenty.jpeg`)
      })
    })
  })
})

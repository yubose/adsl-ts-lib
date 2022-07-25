import * as u from '@jsmanifest/utils'
import * as mock from 'noodl-ui-test-utils'
import { prettyDOM } from '@testing-library/dom'
import sinon from 'sinon'
import { NuiComponent, createComponent, flatten } from 'noodl-ui'
import { waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { coolGold, italic, magenta, white } from 'noodl-common'
import { createRender, ndom, ui } from '../test-utils'
import { nui } from '../nui'
import NOODLDOM from '../noodl-ui-dom'
import * as i from '../utils/internal'
import * as n from '../utils'
import * as c from '../constants'
import Timer from '../global/Timer'

describe(coolGold(`resolvers`), () => {
  it(`should attach the component id as the element id`, async () => {
    const { render } = createRender(ui.label())
    const component = await render()
    expect(n.findFirstByElementId(component))
      .to.have.property('id')
      .eq(component.id)
  })

  it('should display data value if it is displayable', async () => {
    const dataValue = 'asfafsbc'
    const { render } = createRender({
      pageName: 'F',
      pageObject: { formData: { password: dataValue } },
      components: ui.label({ dataKey: 'F.formData.password' }),
    })
    expect(n.findFirstByElementId(await render()).textContent).to.eq(dataValue)
  })

  describe(italic(`button`), () => {
    it('should have a pointer cursor if it has an onClick', async () => {
      const { render } = createRender(
        ui.button({ text: 'hello', onClick: [mock.getFoldedEmitObject()] }),
      )
      expect(n.findFirstByElementId(await render()).style)
        .to.have.property('cursor')
        .eq('pointer')
    })
  })

  describe(italic(`data- attributes`), () => {
    const dataAttribsWithoutSelect = c.dataAttributes.filter(
      (a) => !/options/i.test(a),
    )

    xit(`should be able to attach the ${magenta(
      'data-options',
    )} attribute to a DOM element`, () => {
      //
    })

    dataAttribsWithoutSelect.forEach((attr) => {
      it(`should be able to attach the ${magenta(
        attr,
      )} attribute to a DOM element`, async () => {
        const iteratorVar = 'orange'
        const { request } = createRender({
          components: [
            ui.list({
              listObject: mock.getGenderListObject().slice(0, 1),
              contentType: 'listObject',
              iteratorVar,
              children: [
                ui.listItem({
                  children: [
                    ui.label({ dataKey: `${iteratorVar}.value` }),
                    ui.popUpComponent({
                      viewTag: 'bagTag',
                      popUpView: 'color',
                    }),
                    ui.button({ global: true }),
                    ui.image({ path: '99.png' } as any),
                    ui.textField({ placeholder: 'sun' } as any),
                    ui.select({
                      optionKey: `${iteratorVar}.value`,
                      options: [],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
        const req = await request()
        await req?.render()
        await waitFor(() => {
          expect(
            u.array(n.asHtmlElement(n.findByDataAttrib(attr)))[0],
          ).to.be.instanceOf(HTMLElement)
        })
      })
    })
  })
})

describe(italic(`ecosDoc`), () => {
  it(`should create an iframe as a direct child`, async () => {
    const ecosObj = mock.getEcosDocObject('image')
    const { pageObject, render } = createRender(
      ui.ecosDocComponent({ id: 'hello', ecosObj }),
    )
    await render()
    const node = n.findFirstByElementId('hello')
    await waitFor(() => {
      const child = node.firstElementChild as HTMLIFrameElement
      expect(node).to.have.property('tagName').not.to.eq('IFRAME')
      expect(child).to.have.property('tagName', 'IFRAME')
      const image = child?.contentDocument?.body.querySelector('img')
      expect(image).to.exist
      expect(image).to.have.property('src', ecosObj.name?.data)
    })
  })

  it(`should render ecosDoc image documents`, async () => {
    const imageComponentObject = ui.ecosDocComponent({
      id: 'hello',
      ecosObj: mock.getEcosDocObject('image'),
    })
    const { render } = createRender(imageComponentObject)
    await render()
    const node = n.findFirstByElementId('hello')
    const iframe = node.firstElementChild as HTMLIFrameElement
    await waitFor(() => {
      const image = iframe?.contentDocument?.body.querySelector('img')
      expect(image).to.exist
      expect(image).to.have.property(
        'src',
        imageComponentObject.ecosObj.name.data,
      )
    })
  })

  describe(`pdf`, () => {
    it(`should render pdf documents`, async () => {
      const componentObject = ui.ecosDocComponent({
        ecosObj: ui.ecosDoc('pdf'),
      })
      const { render } = createRender(componentObject)
      const component = await render()
      const node = n.findFirstByElementId(component.id)
      const iframe = node.firstElementChild as HTMLIFrameElement
      await waitFor(() => {
        expect(iframe).to.exist
        expect(iframe).to.have.property('src', 'http://127.0.0.1:3000/')
        expect(iframe.classList.contains(c.classes.ECOS_DOC_PDF)).to.be.true
      })
    })
  })

  describe(`text`, () => {
    describe(`markdown`, () => {
      xit(``, () => {
        //
      })
    })

    describe(`plain`, () => {
      it(`should render plain text documents`, async () => {
        const componentObject = ui.ecosDocComponent({
          id: 'hello',
          ecosObj: mock.getEcosDocObject('text'),
        })
        const { render } = createRender(componentObject)
        const component = await render()
        const node = n.findFirstByElementId(component.id)
        const iframe = node.firstElementChild as HTMLIFrameElement
        await waitFor(() => {
          const text = iframe?.contentDocument?.body.getElementsByClassName(
            c.classes.ECOS_DOC_TEXT,
          )[0]
          expect(text).to.exist
          const textTitle = text?.getElementsByClassName(
            c.classes.ECOS_DOC_TEXT_TITLE,
          )[0]
          const textContent = text?.getElementsByClassName(
            c.classes.ECOS_DOC_TEXT_BODY,
          )[0]
          expect(textTitle).to.exist
          expect(textContent).to.exist
        })
      })
    })
  })

  describe(`videos`, () => {
    xit(``, () => {
      //
    })
  })

  describe(italic(`Displaying`), () => {
    describe(white('note'), () => {
      it(`should only display the note's body content and not the title`, async () => {
        const component = await createRender(
          ui.ecosDocComponent('note'),
        ).render()
        const node = n.findFirstByElementId(component)
        const iframe = node.firstElementChild as HTMLIFrameElement
        await waitFor(() => {
          const body = iframe.contentDocument?.body as HTMLBodyElement
          expect(body).to.exist
          const titleNode = body?.getElementsByClassName(
            c.classes.ECOS_DOC_TEXT_TITLE,
          )[0]
          const descNode = body?.getElementsByClassName(
            c.classes.ECOS_DOC_NOTE_DATA,
          )[0]
          expect(titleNode).not.to.exist
          expect(descNode).to.exist
        })
      })
    })
  })
})

describe(italic(`image`), () => {
  it('should attach the pointer cursor if it has onClick', async () => {
    const { render } = createRender(ui.image({ onClick: [] }))
    expect(n.findFirstByElementId(await render())?.style)
      .to.have.property('cursor')
      .eq('pointer')
  })

  it('should set width and height to 100% if it has children (deprecate soon)', async () => {
    const { render } = createRender(ui.image({ children: [] }))
    const node = n.findFirstByElementId(await render())
    expect(node?.style).to.have.property('width').eq('100%')
    expect(node?.style).to.have.property('height').eq('100%')
  })
})

describe(italic(`label`), () => {
  it('should attach the pointer cursor if it has onClick', async () => {
    const { render } = createRender(ui.image({ onClick: [] }))
    expect(n.findFirstByElementId(await render()).style)
      .to.have.property('cursor')
      .eq('pointer')
  })
})

describe(italic(`list`), () => {
  xit(
    `should generate the same amount of children as the amount of data ` +
      `objects provided`,
    () => {
      //
    },
  )

  xit(`should remove removed list items from the component cache`, async () => {
    const listObject = mock.getGenderListObject()
    const { ndom, render } = createRender(ui.list({ listObject }))
    const component = await render()
    const flattened = flatten(component)
    expect(ndom.cache.component.length).to.eq(flattened.length)
    const child2 = component.child(1)
    expect(ndom.cache.component.has(child2)).to.be.true
    expect(ndom.cache.component.has(child2)).to.be.false
  })

  it(`should remove the corresponding list item's DOM node from the DOM`, async () => {
    const { render } = createRender(ui.list())
    const component = await render()
    const child2 = component.child(1)
    const child2Node = document.getElementById(child2?.id || '')
    expect(document.body.contains(child2Node)).to.be.true
  })

  // TODO - update.list.item handling?
})

describe(italic(`page`), () => {
  let result: ReturnType<typeof createRender>
  let node: HTMLIFrameElement
  let component: NuiComponent.Instance

  it(``, () => {
    //
  })

  // TODO - Find out why this test is freezing
  xit(`should render the page component as an iframe`, async () => {
    const { render } = createRender({
      root: { Dog: { components: [] } },
      components: mock.getPageComponent({
        path: 'Dog' as any,
        children: [
          mock.getTextViewComponent({
            placeholder: 'Type something here',
          } as any),
        ],
      }),
    })
    const node = n.findFirstByElementId(await render())
    expect(node).to.have.property('tagName', 'IFRAME')
  })

  xit(
    `should draw and attach each resolved component as children DOM nodes to ` +
      `node.contentDocument.body`,
    async () => {
      await waitFor(() => {
        // expect(result.node.querySelector('img')).to.exist
        // expect(result.node.querySelector('button')).to.exist
        // expect(result.node.querySelector('label')).to.exist
      })
    },
  )
})

describe.skip(italic(`plugin`), () => {
  it(`should receive a function as the node argument`, async () => {
    const spy = sinon.spy()
    const ndom = new NOODLDOM()
    ndom.register({ cond: 'plugin', resolve: spy })
    await ndom.draw(createComponent({ type: 'plugin', path: 'abc.js' }))
    expect(spy.firstCall.args[0]).to.be.a('function')
  })

  it(`should use the argument node passed to the function as the final node`, async () => {
    const node = document.createElement('div')
    node.id = 'hello'
    const ndom = new NOODLDOM()
    // @ts-expect-error
    ndom.register({ cond: 'plugin', resolve: (getNode) => getNode(node) })
    await ndom.draw(createComponent({ type: 'plugin', path: 'abc.js' }))
    expect(document.body.contains(node)).to.be.true
  })

  describe(`.html`, () => {
    xit(`should render the html to the DOM`, async () => {
      const html = '<div id="hello"><button class="abc">morning</button></div>'
      const fetch = window.fetch
      // @ts-expect-error
      window.fetch = () => Promise.resolve(html)
      const noodlComponent = { type: 'plugin', path: 'abc.html' }
      const component = nui.resolveComponents(noodlComponent)
      const node = await ndom.draw(component)
      await waitFor(() => {
        expect(document.body.contains(node)).to.be.true
      })
      window.fetch = fetch
    })
  })

  describe(`.css`, () => {
    xit(``, () => {
      //
    })
  })

  describe(`.js`, () => {
    describe(`noodl paths`, () => {
      xit(``, () => {
        //
      })
    })

    describe(`lib paths (outside of domain)`, () => {
      xit(``, () => {
        //
      })
    })
  })
})

describe(italic(`styles`), () => {
  describe(`Positioning / Sizing`, () => {
    describe(`when components are missing "top"`, () => {
      const finalKeys = ['top', 'height']

      it(`should always eventually have a value for both of its top and height`, async () => {
        const { render } = createRender({
          components: [
            {
              type: 'view',
              style: { width: '1', height: '1', top: '0', left: '0' },
              children: [
                { type: 'label', style: { top: '0.2' }, text: 'Good morning' },
                { type: 'button', style: { width: '0.2' }, text: 'Submit' },
              ],
            },
          ],
        })

        const component = await render()
        const label = component.child()
        const button = component.child(1)
        const testSubjects = [component, label, button]
        testSubjects.forEach((component) => {
          const node = n.findFirstByElementId(component)
          expect(node.style).to.have.property('top').to.exist
          expect(node.style).to.have.property('height').to.exist
        })
      })

      it(
        `should always make the first child to have the same value of top (in the DOM)` +
          `as their parent`,
        async () => {
          const { page, render } = createRender({
            components: {
              type: 'view',
              style: { width: '1', height: '1', top: '0.3', left: '0' },
              children: [
                {
                  type: 'scrollView',
                  style: { height: '0.1' },
                  children: [
                    { type: 'label', style: {}, text: 'Good morning' },
                    { type: 'button', style: { width: '0.2' }, text: 'Submit' },
                  ],
                },
              ],
            },
          })

          const view = await render()
          const scrollView = view.child()
          const label = scrollView.child()
          const button = scrollView.child(1)

          const grandParentNode = document.getElementById(view.id) as any
          const parentNode = document.getElementById(scrollView.id) as any
          const child1Node = document.getElementById(label.id) as any
          const child2Node = document.getElementById(button.id) as any

          const vh = page.viewport.height

          // expect(parentNode.style)
          //   .to.have.property('top')
          //   .eq(
          //     VP.toNum(grandParentNode.style.top) +
          //       VP.toNum(grandParentNode.style.height) +
          //       'px',
          //   )

          // expect(parentNode.style).to.have.property('top').to.eq(VP.toNum)
          // expect(parentNode.style)
          //   .to.have.property('top')
          //   .to.eq(child1Node.style.top)
        },
      )

      it(`should set marginTop to "0px" if it is missing`, async () => {
        const { render } = createRender({ type: 'list', style: {} })
        const component = await render()
        expect(component.style).to.have.property('marginTop').to.eq('0px')
      })

      xit(
        `should set the child to have the same top as its previous sibling ` +
          `if it is set to "align"`,
        () => {
          //
        },
      )
    })

    it(
      `should be reachable to look at for its dimensions when the child ` +
        `is resolving its positioning`,
      () => {
        //
      },
    )

    describe(`when missing top`, () => {
      xit(`should take the last top that was known`, () => {
        //
      })
    })

    describe(`when missing height`, () => {
      xit(`should `, () => {
        //
      })
    })

    describe(`when missing both top and height`, () => {
      xit(``, () => {
        //
      })
    })
  })
})

describe(italic(`text=func`), () => {
  it(`[lists] should use the dataKey to get the value and pass as args to the text=func func`, async () => {
    const date = new Date().toISOString()
    const spy = sinon.spy(() => date)
    const ctime = 'abc'
    const { render } = createRender(
      ui.list({
        listObject: [{ ctime }],
        iteratorVar: 'itemObject',
        children: [
          ui.listItem({
            children: [
              ui.label({
                dataKey: 'itemObject.ctime',
                'text=func': spy,
              } as any),
            ],
          }),
        ],
      }),
    )
    await render()
    expect(spy).to.be.calledOnce
    expect(spy).to.be.calledWith(ctime)
  })

  it(`[non-lists] should use the dataKey to get the value passed as args to the text=func function`, async () => {
    const date = new Date().toISOString()
    const spy = sinon.spy((v) => 'mock-computed-time-value')
    const { render, getRoot } = createRender({
      currentPage: 'Hello',
      pageName: 'Hello',
      pageObject: {
        components: [
          ui.label({ dataKey: 'formData.ctime', 'text=func': spy } as any),
        ],
        formData: { ctime: date },
      },
    })
    const component = await render()
    expect(spy).to.be.calledOnce
    expect(spy).to.be.calledWith(date)
  })

  describe(`non-timer`, () => {
    xit(`should be able to display a text=func's data values for non timers`, async () => {
      const date = new Date().toISOString()
      const { render } = createRender({
        pageObject: {
          components: [
            ui.label({
              dataKey: 'itemObject.ctime',
              'text=func': (v: any) => v,
            } as any),
          ],
          formData: { ctime: date },
        },
      })
      const component = await render()
      expect(n.findFirstByElementId(component).textContent).to.eq(date)
    })
  })
})

describe(italic(`timer`), () => {
  let timer: Timer | undefined

  afterEach(() => void timer?.clear?.())

  it(`should create a new Timer using the dataKey as the key`, async () => {
    const textFuncResult = Date.now()
    const { ndom, nui, render } = createRender({
      components: ui.label({
        contentType: 'timer',
        dataKey: 'Global.date',
        'text=func': () => textFuncResult,
      }),
    })
    const component = await render()
    component.emit('timer:init', new Date())
    await waitFor(() => {
      expect(ndom.global.timers.has('Global.date')).to.be.true
    })
  })

  it(`should initiate the timer with the custom value if given`, async () => {
    const textFuncResult = Date.now()
    const { ndom, render } = createRender({
      root: {
        Global: { date: textFuncResult, components: [] },
      },
      components: [
        ui.label({
          contentType: 'timer',
          dataKey: 'Global.date',
          'text=func': () => textFuncResult,
        }),
      ],
    })
    const component = await render()
    component.emit('timer:init', 'abc')
    await waitFor(() => {
      expect(ndom.global.timers.get('Global.date')).to.have.property(
        'value',
        'abc',
      )
    })
  })

  xit(`should initiate with a default value if nothing was given`, async () => {
    const textFuncResult = Date.now()
    const { ndom, render } = createRender({
      root: {
        Global: { date: textFuncResult, components: [] },
      },
      components: [
        ui.label({
          contentType: 'timer',
          dataKey: 'Global.date',
          'text=func': () => textFuncResult,
        }),
      ],
    })
    await render()
    await waitFor(() => {
      const timer = ndom.global.timers.get('Global.date')
      expect(timer).to.exist
    })
  })

  it(`should clear the interval when the DOM re-renders`, async () => {
    const textFuncResult = Date.now()
    const dataKey = 'Global.timer'
    const { ndom, render, request } = createRender({
      root: {
        Global: { date: textFuncResult } as any,
        Cereal: { components: [ui.button()] },
      },
      components: [
        ui.label({
          contentType: 'timer',
          dataKey,
          'text=func': () => textFuncResult,
        }),
      ],
    })
    const component = await render()

    component.on('timer:ref', (ref) => ref.start())
    component.emit('timer:init', new Date())
    await waitFor(() => {
      expect(ndom.global.timers.has(dataKey)).to.be.true
      timer = ndom.global.timers.get(dataKey)
      expect(timer).to.have.property('ref').to.exist
    })
    await (await request('Cereal')).render()
    expect(timer).to.have.property('ref').not.to.exist
    component.clear()
  })
})

describe(italic(`video`), () => {
  it('should have object-fit set to "contain"', async () => {
    const { render } = createRender({ type: 'video', videoFormat: 'mp4' })
    const component = await render()
    expect(n.findFirstByElementId(component)?.style.objectFit).to.equal(
      'contain',
    )
  })

  it('should create the source element as a child if the src is present', async () => {
    const { render } = createRender({
      type: 'video',
      path: 'asdloldlas.mp4',
      videoFormat: 'mp4',
    })
    const node = n.findFirstByElementId(await render())
    await waitFor(() => {
      const sourceEl = node?.querySelector('source')
      expect(sourceEl).to.be.instanceOf(HTMLElement)
    })
  })

  it('should have src set on the child source element ', async () => {
    const path = 'asdloldlas.mp4'
    const { assetsUrl, render } = createRender({
      type: 'video',
      path: 'asdloldlas.mp4',
      videoFormat: 'mp4',
    })
    const component = await render()
    const node = n.findFirstByElementId(component)
    await waitFor(() => {
      const sourceEl = node?.querySelector('source')
      expect(sourceEl?.getAttribute('src')).to.equal(assetsUrl + path)
    })
  })

  xit(
    `should have the video type on the child source element instead of ` +
      `the video element itself`,
    async () => {
      const { render } = createRender({
        type: 'video',
        path: 'abc123.mp4',
        videoFormat: 'mp4',
      })
      const node = n.findFirstByElementId(await render())
      await waitFor(() => {
        const sourceEl = node?.querySelector('source')
        expect(node?.getAttribute('type')).not.to.equal('mp4')
        expect(sourceEl?.getAttribute('type')).to.equal(`video/mp4`)
      })
    },
  )

  it('should include the "browser not supported" message', async () => {
    const { render } = createRender({
      type: 'video',
      path: 'abc.jpeg',
      videoFormat: 'mp4',
    })
    const node = n.findFirstByElementId(await render())
    await waitFor(() => {
      const p = node.querySelector('p')
      expect(/sorry/i.test(p?.textContent as string)).to.be.true
    })
  })

  it('should create a "source" element and attach the src attribute for video components', async () => {
    const path = 'pathology.mp4'
    const { assetsUrl, render } = createRender({
      type: 'video',
      path,
      videoFormat: 'mp4',
      id: 'id123',
    })
    const node = n.findFirstByElementId(await render())
    await waitFor(() => {
      const sourceElem = node.querySelector('source')
      expect(sourceElem?.getAttribute('src')).to.equal(assetsUrl + path)
    })
  })
})

/* -------------------------------------------------------
  ---- HOOKS
-------------------------------------------------------- */

describe(italic(`Hooks`), () => {
  describe(`onResource`, () => {
    xit(`should call the resolve functions immediately if the resource node is already in the DOM`, async () => {
      //
    })

    xit(`should not call any of the resolve functions if the resource element is not yet loaded to the DOM`, () => {
      //
    })

    xit(`should pass the resource node and record into args`, () => {
      //
    })
  })
})

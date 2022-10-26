// @ts-nocheck
import * as u from '@jsmanifest/utils'
import m from 'noodl-test-utils'
import { prettyDOM, waitFor } from '@testing-library/dom'
import { expect } from 'chai'
import { createRender } from '../test-utils'
import { dataAttributes } from '../constants'
import NDOM from '../noodl-ui-dom'
import findElement from '../utils/findElement'
import * as i from '../utils/internal'
import * as n from '../utils'

describe(u.yellow(`utils`), () => {
  describe(u.italic(`findByDataKey`), () => {
    xit(``, async () => {
      const { request } = createRender({
        components: [
          m.listItem({
            children: [m.label({ dataKey: 'abc.fruit' as any })],
          }),
        ],
      })
      const req = await request()
      const components = req?.render()
      const component = components?.[0]
      const node = n.findByDataKey(component)?.[0]
      // expect().to.be.instanceOf(HTMLElement)
    })
  })

  describe(u.italic(`findElement`), () => {
    it(`should return an array of nodes if there are multiple nodes matched`, async () => {
      const { request } = createRender({
        components: [
          m.button({ viewTag: 'helloTag' }),
          m.textField({ viewTag: 'helloTag' }),
        ],
      })
      const req = await request('Hello')
      await req?.render()
      const result = findElement((doc) =>
        doc?.querySelectorAll(`[data-viewtag]`),
      ) as HTMLElement[]
      await waitFor(() => expect(result).to.be.an('array').with.lengthOf(2))
    })
  })
})

describe(u.italic(`findByDataAttrib`), () => {
  dataAttributes.forEach((key) => {
    it(`should be able to find a node with the data attribute "${u.magenta(
      key,
    )}"`, async () => {
      const { request } = createRender({
        components: [m.button({ [key]: key }), m.textField({ [key]: key })],
      })
      const req = await request('Hello')
      req?.render()
      const nodes = n.findByDataAttrib(key) as HTMLElement[]
      nodes?.forEach((node) => {
        expect(node).to.be.instanceof(HTMLElement)
        expect(node.dataset).to.have.property(key.replace('data-', ''))
      })
    })
  })

  describe(`isImageDoc`, () => {
    it(`should return true`, () => {
      const ecosObj = m.ecosDoc('image')
      expect(i.isImageDoc(ecosObj)).to.be.true
    })

    it(`should return false`, () => {
      expect(i.isImageDoc(m.ecosDoc('pdf'))).to.be.false
      expect(i.isImageDoc(m.ecosDoc('text'))).to.be.false
      expect(i.isImageDoc(m.ecosDoc('video'))).to.be.false
    })
  })

  describe(`isPdfDoc`, () => {
    it(`should return true`, () => {
      const ecosObj = m.ecosDoc('pdf')
      expect(i.isPdfDoc(ecosObj)).to.be.true
    })

    it(`should return false`, () => {
      expect(i.isPdfDoc(m.ecosDoc('image'))).to.be.false
      expect(i.isPdfDoc(m.ecosDoc('text'))).to.be.false
      expect(i.isPdfDoc(m.ecosDoc('video'))).to.be.false
    })
  })

  describe(`isTextDoc`, () => {
    it(`should return true`, () => {
      const ecosObj = m.ecosDoc('text')
      expect(i.isTextDoc(ecosObj)).to.be.true
    })

    xit(`should return false`, () => {
      expect(i.isTextDoc(m.ecosDoc('image'))).to.be.false
      expect(i.isTextDoc(m.ecosDoc('pdf'))).to.be.false
      expect(i.isTextDoc(m.ecosDoc('video'))).to.be.false
    })
  })

  describe(`isVideoDoc`, () => {
    xit(`should return true`, () => {
      //
    })

    xit(`should return false`, () => {
      //
    })
  })
})

describe(u.italic(`findWindow`), () => {
  it(`should return the main window`, () => {
    expect(n.findWindow(() => true)).to.eq(window)
  })

  it(`should be able to pick and return a nested window`, () => {
    const iframe = document.createElement('iframe')
    const ecosDoc = document.createElement('iframe')
    iframe.id = 'hello'
    ecosDoc.id = 'goodbye'
    iframe.appendChild(ecosDoc)
    document.body.appendChild(iframe)
    const mainWindow = window
    const iframeWindow = iframe.contentWindow
    const ecosDocWindow = ecosDoc.contentWindow
    expect(window).to.eq(mainWindow)
    expect(n.findWindow((win) => win === iframeWindow)).to.eq(iframeWindow)
    expect(n.findWindow((win) => win === ecosDocWindow)).to.eq(ecosDocWindow)
  })
})

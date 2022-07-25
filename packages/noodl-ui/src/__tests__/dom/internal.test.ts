import * as u from '@jsmanifest/utils'
import { expect } from 'chai'
import * as nc from 'noodl-common'
import { createRender, ndom, ui } from '../test-utils'
import { nui } from '../nui'
import * as i from '../utils/internal'
import { waitFor } from '@testing-library/dom'

describe(nc.coolGold(`internal (utilities)`), () => {
  describe(nc.italic(`_syncPages`), () => {
    describe(`when a root page is missing`, () => {
      xit(`should treat the incoming page as the new root page`, () => {
        const page1 = ndom.createPage('SignIn')
        const page2 = ndom.createPage('About')
        i._removePage.call(ndom, page1)
      })
    })

    describe(`when there is a new page component`, () => {
      xit(``, () => {
        //
      })
    })

    describe(`when there is an existing page component with the same page name`, () => {
      xit(`should create a ComponentPage to global pages`, () => {
        ndom.createPage('SignIn')
        expect(ndom.global.pageIds).to.have.lengthOf(1)
        const page2 = ndom.createPage('About')
        expect(ndom.global.pageIds).to.have.lengthOf(2)
        expect(ndom.global.pages).to.have.property(page2.id)
      })
    })

    describe(`when there is an existing page component with an empty string as the page`, () => {
      it(`should dispose the old one and all its associated references to replace with the new ones`, async () => {
        ndom.reset().resync()
        ndom.createPage('SignIn')
        const page2 = ndom.createPage('')
        await waitFor(() => expect(ndom.global.pageIds).to.have.lengthOf(2))
        const page3 = ndom.createPage('')
        ndom.createPage('')
        ndom.createPage('')
        ndom.createPage('')
        ndom.createPage('')
        ndom.createPage('')
        ndom.createPage('')
        ndom.createPage('')
        ndom.createPage('')
        expect(page2).to.not.eq(page3)
        expect(ndom.global.pageIds).to.have.lengthOf(2)
        expect(ndom.global.pageIds).not.to.include(page2.id)
        expect(ndom.global.pageIds).not.to.include(page3.id)
        await waitFor(() => {
          expect(ndom.global.pages).not.to.have.property(page2.id || '')
          expect(ndom.global.pageNames).to.have.lengthOf(2)
          expect(u.values(ndom.global.pages)).to.have.lengthOf(2)
        })
      })

      xit(`should remove all components associated with the old one`, () => {
        ndom.createPage('SignIn')
        const page2 = ndom.createPage('')
        expect(ndom.global.pageIds).to.have.lengthOf(2)
        const page3 = ndom.createPage('')
        expect(ndom.global.pageIds).to.have.lengthOf(2)
        // expect(ndom.global.pages).not.to.have.property(page2.id)
        // expect(ndom.global.pages).to.have.property(page3.id)
        // expect(ndom.global.pageIds).to.include.members([page3.id])
        // expect(ndom.global.pages).not.to.have.property(page2.id)
        // expect(ndom.global.pages).to.have.property(page3.id)
        // expect(ndom.global.pages[page2.id]).to.have.property('page', '')
      })

      xit(`should remove the NUIPage associated with the old one`, () => {
        //
      })

      xit(`should remove the NDOMPage associated with the old one from global`, () => {
        //
      })

      xit(`should replace the old one with the new incoming one`, () => {
        //
      })
    })

    xit(`should only contain one page that has an empty string if there is only one page component loading`, () => {
      //
    })
  })
})

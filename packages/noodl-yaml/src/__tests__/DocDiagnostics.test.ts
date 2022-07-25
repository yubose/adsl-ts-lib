import { expect } from 'chai'
import y from 'yaml'
import sinon from 'sinon'
import { consts } from 'noodl-core'
import DocDiagnostics from '../DocDiagnostics'
import DocRoot from '../DocRoot'
import DocVisitor from '../DocVisitor'

let docDiagnostics: DocDiagnostics
let docRoot: DocRoot
let docVisitor: DocVisitor

beforeEach(() => {
  docDiagnostics = new DocDiagnostics()
  docRoot = new DocRoot()
  docVisitor = new DocVisitor()
  docDiagnostics.use(docVisitor)
  docDiagnostics.use(docRoot)
})

describe(`DocDiagnostics`, () => {
  it(`[mark] should mark the rootConfig`, () => {
    expect(docDiagnostics.markers.rootConfig).to.eq('')
    docDiagnostics.mark('rootConfig', 'admind3')
    expect(docDiagnostics.markers.rootConfig).to.eq('admind3')
  })

  it(`[mark] should mark the appConfig`, () => {
    expect(docDiagnostics.markers.appConfig).to.eq('')
    docDiagnostics.mark('appConfig', 'cadlEndpoint')
    expect(docDiagnostics.markers.appConfig).to.eq('cadlEndpoint')
  })

  it(`[mark] should mark preload pages`, () => {
    expect(docDiagnostics.markers.preload).to.be.empty
    docDiagnostics.mark('preload', 'BaseCSS')
    expect(docDiagnostics.markers.preload).to.have.lengthOf(1)
    expect(docDiagnostics.markers.preload[0]).to.eq('BaseCSS')
    docDiagnostics.mark('preload', 'BasePage')
    expect(docDiagnostics.markers.preload).to.have.lengthOf(2)
    expect(docDiagnostics.markers.preload[1]).to.eq('BasePage')
  })

  it(`[mark] should mark pages`, () => {
    expect(docDiagnostics.markers.pages).to.be.empty
    docDiagnostics.mark('page', 'Dashboard')
    expect(docDiagnostics.markers.pages).to.have.lengthOf(1)
    expect(docDiagnostics.markers.pages[0]).to.eq('Dashboard')
    docDiagnostics.mark('page', 'SignOut')
    expect(docDiagnostics.markers.pages).to.have.lengthOf(2)
    expect(docDiagnostics.markers.pages[1]).to.eq('SignOut')
  })
})

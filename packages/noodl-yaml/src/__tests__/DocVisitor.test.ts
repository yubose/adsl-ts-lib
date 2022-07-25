import { expect } from 'chai'
import sinon from 'sinon'
import y from 'yaml'
import { consts } from 'noodl-core'
import Root from '../DocRoot'
import createNode from '../utils/createNode'
import is from '../utils/is'
import deref from '../utils/deref'
import DocDiagnostics from '../DocDiagnostics'
import DocVisitor from '../DocVisitor'

let docDiagnostics: DocDiagnostics
let docRoot: Root
let docVisitor: DocVisitor

beforeEach(() => {
  docRoot = new Root()
  docRoot.set('Topo', {
    formData: {
      password: '123',
      email: 'pfft@gmail.com',
      currentIcon: '..icon',
      gender: 'Male',
    },
    icon: 'arrow.svg',
  })
  docRoot.set('SignIn', {
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
  docVisitor = new DocVisitor()
  docDiagnostics = new DocDiagnostics()
  docDiagnostics.use(docVisitor)
  docDiagnostics.use(docRoot)
})

describe(`DocVisitor`, () => {
  it(`[visit] should replace the node if returned with a new node`, () => {
    docRoot.clear()
    docRoot.set('Topo', { myGreeting: 'hello!', getMyGreeting: '..myGreeting' })
    const replacedNode = createNode('hello!')
    docDiagnostics.run({
      enter: (args) => {
        if (is.reference(args.node)) return replacedNode
      },
    })
    expect(docRoot.get('Topo.getMyGreeting')).to.eq(replacedNode)
  })

  it(`[visit] should remove the node if returned with REMOVE`, () => {
    docRoot.clear()
    docRoot.set('Topo', { myGreeting: 'hello!', getMyGreeting: '..myGreeting' })
    const replacedNode = createNode('hello!')
    docDiagnostics.run({
      enter: (args) => {
        if (is.reference(args.node)) return y.visit.REMOVE
      },
    })
    expect(docRoot.get('Topo.getMyGreeting')).not.to.eq(replacedNode)
    expect(docRoot.get('Topo.getMyGreeting')).to.be.undefined
  })

  it(`[visit] should keep the node if returned with undefined`, () => {
    docRoot.clear()
    docRoot.set('Topo', { myGreeting: 'hello!', getMyGreeting: '..myGreeting' })
    docDiagnostics.run({
      enter: (args) => {
        if (is.reference(args.node)) return
      },
    })
    expect(docRoot.get('Topo.getMyGreeting'))
      .to.be.instanceOf(y.Scalar)
      .to.have.property('value', '..myGreeting')
  })

  it(`[visit] should replace the node if returned with a new node`, () => {
    docRoot.clear()
    docRoot.set('Topo', { myGreeting: 'hello!', getMyGreeting: '..myGreeting' })
    const replacedNode = createNode('hello!')
    docDiagnostics.run({
      enter: (args) => {
        if (is.reference(args.node)) return replacedNode
      },
    })
    expect(docRoot.get('Topo.getMyGreeting')).to.eq(replacedNode)
  })

  it(`[visitAsync] should remove the node if returned with REMOVE`, async () => {
    docRoot.clear()
    docRoot.set('Topo', { myGreeting: 'hello!', getMyGreeting: '..myGreeting' })
    const replacedNode = createNode('hello!')
    await docDiagnostics.runAsync({
      enter: (args) => {
        if (is.reference(args.node)) return y.visitAsync.REMOVE
      },
    })
    expect(docRoot.get('Topo.getMyGreeting')).not.to.eq(replacedNode)
    expect(docRoot.get('Topo.getMyGreeting')).to.be.undefined
  })

  it(`[visitAsync] should keep the node if returned with undefined`, async () => {
    docRoot.clear()
    docRoot.set('Topo', { myGreeting: 'hello!', getMyGreeting: '..myGreeting' })
    await docDiagnostics.runAsync({
      enter: (args) => {
        if (is.reference(args.node)) return
      },
    })
    expect(docRoot.get('Topo.getMyGreeting'))
      .to.be.instanceOf(y.Scalar)
      .to.have.property('value', '..myGreeting')
  })

  it(`should replace references with their values`, () => {
    let before = docRoot.toJSON() as any
    expect(before.Topo.formData.currentIcon).to.eq('..icon')
    expect(before.SignIn.components[1].children[0].text).to.eq('.SignIn.email')
    docDiagnostics.run({
      enter: ({ add, page, node, root }) => {
        if (is.scalarNode(node) && is.reference(node)) {
          const derefed = deref({
            node,
            root: docRoot,
            rootKey: page,
          })
          if (typeof derefed.value === 'undefined') {
            add({
              node,
              messages: [
                {
                  type: consts.ValidatorType.INFO,
                  message: `Reference '${derefed.reference}' was not resolvable`,
                },
              ],
              page,
              ...derefed,
            })
          } else {
            return createNode(derefed.value)
          }
        }
      },
    })
    let after = docRoot.toJSON() as any
    expect(after.Topo.formData.currentIcon).to.eq('arrow.svg')
    expect(after.SignIn.components[1].children[0].text).to.eq('lopez@yahoo.com')
  })
})

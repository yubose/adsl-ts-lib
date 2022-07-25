import { expect } from 'chai'
import y from 'yaml'
import Root from '../DocRoot'
import transformIf, { If } from '../transformers/if'
import merge from '../transformers/merge'
import replace from '../transformers/replace'

let root: Root

describe(`transformers`, () => {
  describe(`if`, () => {
    beforeEach(() => {
      root = new Root()
      root.set(
        'Topo',
        new y.Document({
          formData: {
            password: '123',
            email: 'pfft@gmail.com',
            currentIcon: '..icon',
          },
          icon: 'arrow.svg',
        }),
      )
    })

    xit(`should return the truthy value if cond is truthy`, () => {
      const doc = new y.Document({ if: [true, {}, []] })
      const ifNode = (doc.contents as y.YAMLMap).get('if') as If
      const expectedResult = ifNode.get(1) as y.YAMLSeq
      const result = transformIf(ifNode)
      expect(result).to.eq(expectedResult.get(1))
    })

    xit(`should return the falsey value if cond is falsey`, () => {
      const doc = new y.Document({ if: [false, {}, []] })
      const ifNode = doc.contents as If
      const expectedResult = ifNode.get('if') as y.YAMLSeq
      const result = transformIf(ifNode)
      expect(result).to.eq(expectedResult)
    })

    it(`should return the falsey value if cond is falsey`, () => {})
  })

  describe(`merge`, () => {
    beforeEach(() => {
      root = new Root()
      root.set(
        'Topo',
        new y.Document({
          formData: {
            password: '123',
            email: 'pfft@gmail.com',
            currentIcon: '..icon',
          },
          icon: 'arrow.svg',
        }),
      )
      root.set(
        'SignIn',
        new y.Document({
          formData: {
            profile: { username: 'hello123', email: 'pfft@gmail.com' },
          },
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
        }),
      )
    })

    it(`should not return null if given a null value to merge`, () => {
      const contents = { fruits: new y.Scalar('apple'), path: 'abc.png' }
      const doc = new y.Document(contents)
      const node = doc.contents as y.YAMLMap
      expect(merge(node, null, { root })).not.to.be.null
      expect(merge(node, undefined, { root })).not.to.be.null
    })

    it(`should not return null if given an unresolvable reference to merge`, () => {
      const contents = { fruits: new y.Scalar('apple'), path: 'abc.png' }
      const doc = new y.Document(contents)
      const node = doc.contents as y.YAMLMap
      expect(merge(node, '.SignIn', { root })).not.to.be.null
      expect(merge(node, '..SignIn', { root })).not.to.be.null
      expect(merge(node, '=.SignIn', { root })).not.to.be.null
      expect(merge(node, '..a', { root })).not.to.be.null
      expect(merge(node, '.SignIn.a', { root })).not.to.be.null
      expect(merge(node, '=.', { root })).not.to.be.null
      expect(merge(node, '=.builtIn.string.concat', { root })).not.to.be.null
    })

    it(`should return the result of the resolved reference if node is a nullish/empty value`, () => {
      expect(merge(null, '.SignIn', { root })).to.deep.eq(root.get('SignIn'))
    })

    xdescribe(`when merging map node references`, () => {
      let contents: { fruits: y.Scalar; path: string }
      let doc: y.Document
      let node: y.YAMLMap

      beforeEach(() => {
        contents = { fruits: new y.Scalar('apple'), path: 'abc.png' }
        doc = new y.Document(contents)
        node = doc.contents as y.YAMLMap
      })

      for (const [type, ref, options] of [
        ['root', '.SignIn.formData.profile'],
        ['local', '..formData.profile', { rootKey: 'SignIn' }],
        // ['local', '=..formData.profile', { rootKey: 'SignIn' }],
      ] as const) {
        it(`should merge ${type} reference ${ref}`, () => {
          const result = merge(node, ref, { root, ...options })
          expect(result).to.have.property('username', 'hello123')
          expect(result).to.have.key('email')
          expect(result.items).to.have.lengthOf(4)
          expect(result.toJSON()).to.deep.eq({
            fruits: 'apple',
            path: 'abc.png',
            username: 'hello123',
            email: 'pfft@gmail.com',
          })
        })
      }
    })
  })

  describe(`replace`, () => {
    beforeEach(() => {
      root = new Root()
      root.set(
        'Topo',
        new y.Document({
          formData: {
            password: '123',
            email: 'pfft@gmail.com',
            currentIcon: '..icon',
          },
          icon: 'arrow.svg',
        }),
      )
    })

    it(`should replace the value on a Scalar`, () => {
      const node = new y.Scalar('hello')
      expect(replace(node, 'goodbye').value).to.eq('goodbye')
    })

    it(`should replace the value on a Pair`, () => {
      const node = new y.Pair('cereal', { fruits: {} })
      expect(replace(node, 'hello').value).to.eq('hello')
    })

    it(`should replace the value on a YAMLMap`, () => {
      const node = new y.YAMLMap()
      node.set('fruits', ['apples'])
      node.set('apple', 0)
      expect(replace(node, 'apple', 'hello').toJSON()).to.deep.eq({
        fruits: ['apples'],
        apple: 'hello',
      })
    })

    it(`should replace the value on a YAMLSeq`, () => {
      const node = new y.YAMLSeq()
      node.set(0, 'apples')
      node.set(3, 'apple')
      node.add({ name: 'Gerald' })
      expect(replace(node, 1, 'hello').toJSON()).to.deep.eq([
        'apples',
        'hello',
        undefined,
        'apple',
        { name: 'Gerald' },
      ])
    })

    xit(`should replace the value on a DocRoot`, () => {
      expect(replace(root, 'Apple', []).toJSON()).to.deep.eq({
        Apple: [],
        Topo: {
          formData: {
            password: '123',
            email: 'pfft@gmail.com',
            currentIcon: '..icon',
          },
          icon: 'arrow.svg',
        },
      })
    })
  })
})

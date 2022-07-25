import * as mock from 'noodl-ui-test-utils'
import { expect } from 'chai'
import { coolGold, italic, magenta } from 'noodl-common'
import sinon from 'sinon'
import Component from '../Component'
import createComponent from '../utils/createComponent'

describe(coolGold(`BaseComponent`), () => {
  describe(italic(`Instantiating`), () => {
    it(`should have an assigned in`, () => {
      expect(new Component(mock.getListComponent())).to.have.property('id').to
        .exist
    })
  })

  describe(italic(`blueprint`), () => {
    it(`should be able to access the original component by blueprint`, () => {
      const component = mock.getListComponent()
      expect(new Component(component))
        .to.have.property('blueprint')
        .to.eq(component)
    })
  })

  describe(italic(`edit`), () => {
    describe(`function`, () => {
      it(`should merge the returned object to the component`, () => {
        const component = new Component(mock.getLabelComponent())
        component.edit(() => ({ display: 'flex', alignItems: 'flex-start' }))
        expect(component.props).to.satisfy(
          (props: any) =>
            props.display === 'flex' && props.alignItems === 'flex-start',
        )
      })

      it(
        `should merge the style object values with the existing style ` +
          `object instead of overwriting it`,
        () => {
          const component = new Component(
            mock.getLabelComponent({ style: { border: { style: '2' } } }),
          )
          component.edit(() => ({
            style: { display: 'flex', alignItems: 'flex-start' },
          }))
          expect(component.props).to.satisfy(
            (props: any) =>
              props.style.display === 'flex' &&
              props.style.alignItems === 'flex-start' &&
              props.style.border.style === '2',
          )
        },
      )
    })

    describe(`object`, () => {
      it(`should merge the object to the component`, () => {
        const component = new Component(mock.getLabelComponent())
        component.edit({ display: 'flex', alignItems: 'flex-start' })
        expect(component.props).to.satisfy(
          (props: any) =>
            props.display === 'flex' && props.alignItems === 'flex-start',
        )
      })

      it(
        `should merge the style object values with the existing style ` +
          `object instead of overwriting it`,
        () => {
          const component = new Component(
            mock.getLabelComponent({ style: { border: { style: '2' } } }),
          )
          component.edit(() => ({
            style: { display: 'flex', alignItems: 'flex-start' },
          }))
          expect(component.props).to.satisfy(
            (props: any) =>
              props.style.display === 'flex' &&
              props.style.alignItems === 'flex-start' &&
              props.style.border.style === '2',
          )
        },
      )

      it(
        `should reset the style object to an empty object if given a key ` +
          `"style" and an explicit value of ${magenta(null)}`,
        () => {
          const component = new Component(
            mock.getLabelComponent({
              style: {
                border: { style: '2' },
                display: 'flex',
                alignItems: 'flex-start',
              },
            }),
          )
          component.edit({ style: null })
          expect(component.props).to.have.property('style').to.be.empty
        },
      )

      describe(`string`, () => {
        it(`should set the key/value pair on the component`, () => {
          const component = new Component(mock.getLabelComponent())
          component.edit('placeholder', 'hello!')
          expect(component.props).to.have.property('placeholder', 'hello!')
        })
      })
    })

    describe(italic(`style`), () => {
      it(
        `should instantiate an empty object when retrieving styles and styles ` +
          `is not an object that is not an object`,
        () => {
          const component = new Component({ type: 'view' })
          expect(component.style).to.be.an('object').to.exist
        },
      )
    })

    describe(italic(`children`), () => {
      it(
        `should save the child in its children that can be received by c` +
          `alling its children getter`,
        () => {
          const component = createComponent({ type: 'list' })
          expect(component.child()).to.be.undefined
          const child = createComponent({ type: 'view' })
          component.createChild(child)
          expect(component.children).to.have.lengthOf(1)
          expect(component.child()).to.equal(child)
        },
      )

      describe(italic(`removeChild`), () => {
        it('should remove the child from its children', () => {
          const component = new Component({ type: 'label' })
          const list = component.createChild(createComponent('list'))
          const listItem = list.createChild(
            new Component(mock.getListItemComponent()),
          )
          expect(listItem.length).to.eq(0)
          listItem.createChild(new Component(mock.getLabelComponent()))
          expect(listItem.length).to.eq(1)
          listItem.createChild(new Component(mock.getButtonComponent()))
          expect(listItem.length).to.eq(2)
          const textField = listItem.createChild(
            new Component(mock.getTextFieldComponent()),
          )
          expect(listItem.length).to.eq(3)
          listItem.removeChild(textField)
          expect(listItem.length).to.eq(2)
          expect(listItem.children.includes(textField)).to.eq(false)
        })

        it('should remove the child by index', () => {
          const component = new Component({ type: 'label' })
          component.createChild(createComponent('button'))
          const child2 = component.createChild(createComponent('view'))
          const children = component.children
          const index = 1
          expect(children[index]).to.equal(child2)
          component.removeChild(index)
          expect(component.children.includes(child2)).to.be.false
        })

        it('should remove the child by its id', () => {
          const component = new Component({ type: 'label' })
          component.createChild(createComponent('button'))
          const child2 = component.createChild(createComponent('view'))
          expect(component.children.includes(child2)).to.be.true
          component.removeChild(child2.id)
          expect(component.children.includes(child2)).to.be.false
        })

        it(`should remove the child by instance reference`, () => {
          const component = new Component({ type: 'label' })
          component.createChild(createComponent('button'))
          component.createChild(createComponent('textField'))
          const child3 = component.createChild(createComponent('view'))
          component.removeChild(child3)
          expect(component.children.includes(child3)).to.be.false
        })
      })

      it('should return all of its children', () => {
        const component = new Component(mock.getListComponent())
        ;[1, 1, 1, 1].forEach(() =>
          component.createChild(new Component({ type: 'listItem' })),
        )
        expect(component.children).to.have.lengthOf(4)
      })

      it('should allow children to get access to this instance', () => {
        const component = new Component(mock.getPopUpComponent())
        const children = component.children
        children.forEach((child) => {
          expect(child.parent).to.equal(component)
        })
      })

      it('should be able to walk down the children hierarchy', () => {
        const component = new Component(mock.getButtonComponent())
        const child1 = component.createChild(
          new Component(mock.getDividerComponent()),
        )
        const child1Child = child1.createChild(
          new Component(mock.getFooterComponent()),
        )
        const child1ChildChild = child1Child.createChild(
          new Component(mock.getLabelComponent()),
        )
        expect(component.child().child().child()).to.equal(child1ChildChild)
      })

      it('should remove the first child if args is empty', () => {
        const component = new Component(mock.getButtonComponent())
        const label = component.createChild(
          new Component(mock.getTextFieldComponent()),
        )
        const textField = component.createChild(
          new Component(mock.getTextFieldComponent()),
        )
        expect(component).to.have.lengthOf(2)
        component.removeChild()
        expect(component).to.have.lengthOf(1)
        expect(component.child()).to.not.equal(label)
        expect(component.child()).to.equal(textField)
      })
    })
  })

  describe(italic(`toJSON`), () => {
    it(`should also run toJSON on all of its children`, () => {
      const spies = [] as sinon.SinonSpy[]
      const component = new Component(mock.getListComponent())
      Array(5)
        .fill(null)
        .forEach(() => {
          const child = new Component(mock.getLabelComponent())
          component.createChild(child)
          const spy = sinon.spy(child, 'toJSON')
          spies.push(spy)
        })
      expect(component.length).to.eq(5)
      component.toJSON()
      spies.forEach((spy) => {
        expect(spy).to.be.calledOnce
        spy.restore()
      })
    })
  })
})

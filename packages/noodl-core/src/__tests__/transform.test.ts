import { expect } from 'chai'
import type { SelectComponentObject } from 'noodl-types'
import transform from '../transform'
import * as fp from '../utils/fp'
import * as n from '../utils/noodl'
import * as t from '../types'

let viewport: t.IViewport

beforeEach(() => {
  viewport = { width: 375, height: 600 }
})

const parse = (comp: any, opts?: Parameters<typeof transform>[2]) =>
  transform({}, comp, { viewport: { width: 375, height: 667 }, ...opts })

describe('transform', () => {
  describe(`dataKey`, () => {
    it(`[textField] should set value on data-value`, () => {
      const opts = {
        root: { SignIn: { formData: { password: '123' } } },
        pageName: 'SignIn',
      }
      expect(
        parse({ type: 'textField', dataKey: 'formData.password' }, opts),
      ).to.have.property('data-value', '123')
      expect(
        parse({ type: 'textField', dataKey: 'SignIn.formData.password' }, opts)[
          'data-value'
        ],
      ).to.eq('123')
    })

    it(`[label] should set value on data-value`, () => {
      const opts = {
        root: { SignIn: { formData: { password: '123' } } },
        pageName: 'SignIn',
      }
      expect(
        parse({ type: 'label', dataKey: 'formData.password' }, opts),
      ).to.have.property('data-value', '123')
      expect(
        parse({ type: 'label', dataKey: 'SignIn.formData.password' }, opts)[
          'data-value'
        ],
      ).to.eq('123')
    })
  })

  describe(`arbitrary reference strings`, () => {
    for (const [ref, key, value] of [
      ['..formData.password', 'placeholder', '123'],
      ['.Topo.images.0.icon', 'icon', 'user.svg'],
      ['.Topo.images.0.moreImages.1.evenMoreImages.2', 'avatar', 'user.svg'],
      ['..finalIcon', 'avatar', 'user.svg'],
    ]) {
      it(`should resolve the reference "${ref}"`, () => {
        const opts = {
          root: {
            SignIn: { finalIcon: 'user.svg', formData: { password: '123' } },
            Topo: {
              images: [
                {
                  icon: '.Abc.icon',
                  moreImages: [
                    9,
                    { evenMoreImages: [1, 4, '..images.0.icon'] },
                  ],
                },
              ],
            },
            Abc: { icon: '..myIcon', myIcon: '.SignIn.finalIcon' },
          },
          pageName: 'SignIn',
        }
        expect(parse({ type: 'view', [key]: ref }, opts)).to.have.property(
          key,
          value,
        )
      })
    }
  })

  describe(`select`, () => {
    let root: Record<string, any>
    let normalize = (comp: Partial<SelectComponentObject>) =>
      parse({ type: 'select', ...comp }, { root, pageName: 'SignIn' })

    beforeEach(() => {
      root = {
        SignIn: {
          selectedOption: '2AM',
          profile: { options: ['1AM', '2AM', '3AM'] },
        },
      }
    })

    it(`should set resolved options as data-options`, () => {
      const opts = { root, pageName: 'SignIn' }
      const result = parse(
        { type: 'select', dataKey: '..profile.options', options: '' },
        opts,
      )
      expect(result)
        .to.have.property('data-options')
        .to.deep.eq(['1AM', '2AM', '3AM'])
    })

    for (const ref of ['.SignIn.selectedOption', 'SignIn.selectedOption']) {
      it(`should set the data-value if dataKey is "${ref}"`, () => {
        expect(normalize({ dataKey: ref }))
          .to.have.property('data-value')
          .deep.eq(root.SignIn.selectedOption)
      })
    }

    it(`should parse options references`, () => {
      expect(
        parse(
          { type: 'select', options: '.SignIn.profile.options' },
          {
            root: { SignIn: { profile: { options: ['1AM', '2AM', '3AM'] } } },
            pageName: 'SignIn',
          },
        ),
      )
        .to.have.property('options')
        .deep.eq(['1AM', '2AM', '3AM'])
    })
  })

  describe(`styles`, () => {
    describe(`Alignment`, () => {
      describe(`axis`, () => {
        it(
          `should change { axis: "horizontal" } to ` +
            `{ display: 'flex', flexWrap: 'nowrap' }`,
          () => {
            expect(
              parse({ type: 'button', style: { axis: 'horizontal' } }).style,
            ).to.satisfy((s) => s.display === 'flex' && s.flexWrap === 'nowrap')
          },
        )

        it(
          `should change { axis: 'vertical' } to ` +
            `{ display: 'flex', flexDirection: 'column' }`,
          () => {
            expect(
              parse({ type: 'button', style: { axis: 'vertical' } }).style,
            ).to.satisfy(
              (s: any) => s.display === 'flex' && s.flexDirection === 'column',
            )
          },
        )

        it(`should remove the property after being consumed`, () => {
          expect(
            parse({ type: 'button', style: { axis: 'vertical' } }).style,
          ).not.to.have.property('axis')
        })
      })

      const leftCenterRightKeys = ['left', 'center', 'right'] as const

      it(`should change { textAlign: 'centerX' } to { textAlign: 'center' }`, () => {
        const component = parse({
          type: 'button',
          style: { textAlign: 'centerX' },
        })
        expect(component.style).to.have.property('textAlign', 'center')
      })

      describe(`{ textAlign: 'centerY' }`, () => {
        it(`should change to { display: 'flex', alignItems: 'center' }`, () => {
          expect(
            parse({ type: 'button', style: { textAlign: 'centerY' } }).style,
          ).to.satisfy((s) => s.display === 'flex' && s.alignItems === 'center')
        })

        it(`should delete the textAlign property`, () => {
          expect(
            parse({ type: 'button', style: { textAlign: 'centerY' } }).style,
          ).not.to.have.property('textAlign')
        })
      })

      leftCenterRightKeys.forEach((key) => {
        it(`should change { textAlign: '${key}' } to { textAlign: '${key}' }`, () => {
          expect(parse({ type: 'button', style: { textAlign: key } }).style)
            .to.have.property('textAlign')
            .eq(key)
        })
      })

      it(`should change { textAlign: { x: 'left' } } to { textAlign: 'left' }`, () => {
        expect(
          parse({ type: 'button', style: { textAlign: { x: 'left' } } }).style,
        )
          .to.have.property('textAlign')
          .eq('left')
      })

      // @ts-expect-error
      leftCenterRightKeys
        .concat(['centerX'])
        .forEach((key: typeof leftCenterRightKeys[number] | 'centerX') => {
          it(
            `should change { textAlign: { x: '${key}', y: 'center' } } to ` +
              `{ textAlign: '${key}', display:'flex', alignItems: 'center }`,
            () => {
              const { style } = parse({
                type: 'button',
                style: { textAlign: { x: key, y: 'center' } },
              })
              if (key === 'left') {
                expect(style).to.have.property('textAlign', 'left')
                expect(style).to.have.property('display', 'flex')
                expect(style).to.have.property('alignItems', 'center')
              } else if (key === 'center' || key === 'centerX') {
                expect(style).to.have.property('textAlign', 'center')
                expect(style).to.have.property('display', 'flex')
                expect(style).to.have.property('alignItems', 'center')
              } else {
                expect(style).to.have.property('textAlign', 'right')
                expect(style).to.have.property('display', 'flex')
                expect(style).to.have.property('alignItems', 'center')
              }
            },
          )
        })
    })

    describe(`Border`, () => {
      Object.keys(n.presets.border).forEach((borderPresetKey) => {
        it(`should apply the styles from the border preset "${borderPresetKey}"`, () => {
          expect(
            parse({
              type: 'textField',
              style: { border: borderPresetKey as any },
            }).style,
          ).to.satisfy((s) => fp.entries(s).every(([k, v]) => s[k] === v))
        })
      })

      it(`should format the borderColor to hex format`, () => {
        expect(
          parse({
            type: 'textField',
            style: { border: { color: '0x33004433' } },
          }).style,
        ).to.have.property('borderColor', '#33004433')
      })

      it(`should set the borderStyle to the value of border.line`, () => {
        expect(
          parse({ type: 'textField', style: { border: { line: 'thin' } } })
            .style,
        ).to.have.property('borderStyle', 'thin')
      })

      it(`should set the borderWidth to the value of border.width`, () => {
        expect(
          parse({ type: 'textField', style: { border: { width: 'thin' } } })
            .style,
        ).to.have.property('borderWidth', 'thin')
      })

      it('should attach px if borderRadius is a number string with no unit', () => {
        let result = parse({ type: 'textField', style: { borderRadius: '0' } })
        expect(result.style.borderRadius).to.eq('0px')
        result = parse({ type: 'textField', style: { borderRadius: '12' } })
        expect(result.style.borderRadius).to.eq('12px')
      })

      it('should attach px if borderWidth is a number string with no unit', () => {
        let result = parse({ type: 'textField', style: { borderWidth: '0' } })
        expect(result.style.borderWidth).to.eq('0px')
        result = parse({ type: 'textField', style: { borderWidth: '12' } })
        expect(result.style.borderWidth).to.eq('12px')
      })
    })

    describe(`Color`, () => {
      it('should rename textColor to color and remove textColor', () => {
        const result = parse({
          type: 'view',
          style: { textColor: '0x33445566' },
        })
        expect(result.style).to.have.property('color', '#33445566')
        expect(result.style).not.to.have.property('textColor')
      })

      it('should format color values like 0x000000 to #000000 from any property', () => {
        const style = {
          abc: '0x33210299',
          hello: '0x33210299',
          qqqqqq: '0x33210299',
          textColor: '0x33210299',
          backgroundColor: '0x33210299',
          background: '0x33210299',
          borderColor: '0x33210299',
        }
        const result = parse({ type: 'view', style })
        expect(result.style?.abc).to.eq('#33210299')
        Object.keys(style).forEach((k) => {
          if (k !== 'textColor') {
            expect(result.style).to.have.property(k, '#33210299')
          }
        })
      })
    })

    describe(`Display`, () => {
      it(`should always keep { display: 'inline' } if it was provided`, () => {
        expect(
          { type: 'button', style: { display: 'inline' } }.style,
        ).to.have.property('display', 'inline')
      })
    })

    describe(`fontSize`, () => {
      it(`should always append px`, () => {
        let result = parse({ type: 'select', style: { fontSize: '14' } })
        expect(result.style).to.have.property('fontSize', '14px')
        result = parse({ type: 'select', style: { fontSize: '10' } })
        expect(result.style).to.have.property('fontSize', '10px')
        result = parse({ type: 'select', style: { fontSize: 10 } as any })
        expect(result.style).to.have.property('fontSize', '10px')
        result = parse({ type: 'select', style: { fontSize: 0 } as any })
        expect(result.style).to.have.property('fontSize', '0px')
      })

      const getComponent = (fontSize: string) => ({
        type: 'button',
        style: { fontSize },
      })

      const getOptions = (opts?: Parameters<typeof transform>[2]) => ({
        viewport,
        ...opts,
      })

      describe(`vw/vh`, () => {
        const getComponent = (fontSize: string) =>
          ({
            type: 'button',
            style: { fontSize },
          } as any)

        it(`should return back the original value if viewport dimensions are missing`, () => {
          expect(transform({}, getComponent('2.8vh')).style).to.have.property(
            'fontSize',
            '2.8vh',
          )
        })

        it(`should set the right size`, () => {
          const fontSize = parse(
            getComponent('2.8vh'),
            getOptions({ viewport: { width: 1024, height: 768 } }),
          )?.style?.fontSize
          expect(fp.toNum(fontSize, 1)).to.eq(21.5)
        })

        it(`should set the right size from local references`, () => {
          const fontSize = parse(
            getComponent('..f'),
            getOptions({
              pageName: 'Topo',
              root: { Topo: { f: '2.8vh' } },
              viewport: { width: 1024, height: 768 },
            }),
          )?.style?.fontSize
          expect(fp.toNum(fontSize, 1)).to.eq(21.5)
        })

        it(`should set the right size from root references`, () => {
          const fontSize = parse(
            getComponent('.Topo.f'),
            getOptions({
              pageName: 'Topo',
              root: { Topo: { f: '2.8vh' } },
              viewport: { width: 1024, height: 768 },
            }),
          )?.style?.fontSize
          expect(fp.toNum(fontSize, 2)).to.eq(21.5)
        })

        it(`should return the value in vw/vh if keepVpUnit === true`, () => {
          const fontSize = parse(
            getComponent('.Topo.f'),
            getOptions({
              pageName: 'Topo',
              root: { Topo: { f: '4vh' } },
            }),
          )?.style?.fontSize
          console.info(fontSize)
        })
      })

      describe(`fontSize references`, () => {
        let root: Record<string, any>

        beforeEach(() => {
          root = {
            Nfont: { h1: '1.6vh' },
            Sfont: { h4: '4.5vh' },
            Topo: {
              font1: '.Nfont.h1',
              components: [
                {
                  type: 'label',
                  viewTag: 'helloTag',
                  style: { top: '0.0125', left: '0.05', fontSize: '.Sfont.h4' },
                },
                {
                  type: 'view',
                  style: { fontSize: '..font1' },
                },
              ],
            },
          }
        })

        it(`should correctly resolve fontSize references`, () => {
          const [label1, list1] = root.Topo.components.map((c) =>
            parse(c, { pageName: 'Topo', root }),
          )
          expect(label1.style).to.have.property('fontSize', `${30.02}px`)
          expect(list1.style).to.have.property('fontSize', `${10.67}px`)
        })

        it(`should keep the values in vp unit if keepVpUnit === true`, () => {
          let componentObject = { type: 'label', style: { fontSize: '2.8vh' } }
          let component = parse(componentObject)
          expect(component.style).to.have.property('fontSize', '18.68px')
          component = parse(componentObject, { keepVpUnit: true })
          expect(component.style).to.have.property('fontSize', `calc(2.8vh)`)
        })
      })
    })

    describe(`fontWeight`, () => {
      it('should return a fontWeight with bold if fontStyle was bold', () => {
        const result = parse({
          type: 'scrollView',
          style: { fontStyle: 'bold' },
        })
        expect(result.style).to.have.property('fontWeight', 'bold')
        expect(result.style).not.to.have.property('fontStyle')
      })
    })

    describe(`Positioning`, () => {
      it('should append the unit if missing', () => {
        let result = parse({ type: 'video', style: { top: '0' } })
        expect(result.style).to.have.property('top', '0px')
        result = parse({ type: 'video', style: { left: '0' } })
        expect(result.style).to.have.property('left', '0px')
      })

      it('should change to "667px" for top and "375px" for left', () => {
        let result = parse({ type: 'video', style: { top: '1' } })
        expect(result.style).to.have.property('top', '667px')
        result = parse({ type: 'video', style: { left: '1' } })
        expect(result.style).to.have.property('left', '375px')
      })

      it('should get correct results for decimal strings like "0.23"', () => {
        let result = parse({ type: 'video', style: { top: '0.23' } })
        expect(result.style).to.have.property('top', '153.41px')
        result = parse({ type: 'video', style: { left: '0.89' } })
        expect(result.style).to.have.property('left', '333.75px')
      })
    })

    describe(`Sizes`, () => {
      // '0.45' --> '168.75px'
      it('should return the string decimal as px', () => {
        let result = parse({ type: 'select', style: { width: '0.45' } })
        expect(result.style).to.have.property('width', '168.75px')
        result = parse({ type: 'select', style: { height: '0.29' } })
        expect(result.style).to.have.property('height', '193.43px')
      })

      // '23px' --> '23px'
      it('should return the same value if px was already appended', () => {
        const style = { width: '23px', height: '0.27px' }
        const result = parse({ type: 'select', style })
        expect(result.style).to.have.property('width', '23.00px')
        expect(result.style).to.have.property('height', '0.27px')
      })

      // '0' --> 0
      it('should return a value of 0 and append px to it', () => {
        const style = { width: '0', height: '0' }
        const result = parse({ type: 'select', style })
        expect(result.style.width).to.equal('0.00px')
        expect(result.style.height).to.equal('0.00px')
      })

      // '1' --> 375px
      it('should just return the viewport size with px appended if value is "1"', () => {
        const style = { width: '1', height: '1' }
        const result = parse({ type: 'select', style })
        expect(result.style.width).to.equal('375.00px')
        expect(result.style.height).to.equal('667.00px')
      })

      // 1 --> '375px'
      it('should return the the size with px appended if value is a number 1', () => {
        let result = parse({ type: 'select', style: { width: 1 } as any })
        expect(result.style.width).to.equal('375.00px')
        result = parse({ type: 'select', style: { height: 1 } as any })
        expect(result.style.height).to.equal('667.00px')
      })

      // 0 --> '0px'
      it('should keep it at 0 but convert to string and append px', () => {
        const result = parse({
          type: 'select',
          style: { width: 0, height: 0 } as any,
        })
        expect(result.style.width).to.equal('0.00px')
        expect(result.style.height).to.equal('0.00px')
      })

      // 35 --> 35px
      it('should return the value with px appended', () => {
        const result = parse({
          type: 'select',
          style: { width: 38, height: 203 } as any,
        })
        expect(result.style.width).to.equal('38.00px')
        expect(result.style.height).to.equal('203.00px')
      })

      // 0.45 --> '168.75px'
      it('should treat 0.45 as "0.45" (divide by total viewport size)', () => {
        const result = parse({
          type: 'select',
          style: { width: 0.45, height: 0.23 } as any,
        })
        expect(result.style.width).to.equal('168.75px')
        expect(result.style.height).to.equal('153.41px')
      })
    })

    describe(`Visibility`, () => {
      it('should turn visibility to hidden if "isHidden" is true', () => {
        expect(
          parse({ type: 'image', style: { isHidden: true } }).style,
        ).to.have.property('visibility', 'hidden')
      })
    })
  })

  describe(`Component specific`, () => {
    describe(`header`, () => {
      it(`should set zIndex to 100`, () => {
        expect(parse({ type: 'header' }).style).to.have.property('zIndex', 100)
      })
    })

    describe(`image`, () => {
      it(
        `should remove the "height" if it does not explicitly have ` +
          `a height set to maintain the aspect ratio`,
        () => {
          expect(parse({ type: 'image' }).style).not.to.have.property('height')
        },
      )

      it(`should set objectFit to "contain"`, () => {
        expect(parse({ type: 'image' }).style).to.have.property(
          'objectFit',
          'contain',
        )
      })
    })

    describe(`list`, () => {
      it(`should disable listStyle and padding`, () => {
        const styles = parse({ type: 'list' }).style
        expect(styles).to.have.property('listStyle', 'none')
        expect(styles).to.have.property('padding', '0px')
      })
    })

    describe(`listItem`, () => {
      it(`should remove listStyle and set padding to 0`, () => {
        expect(parse({ type: 'listItem' }).style).to.satisfy(
          (s) => s.listStyle === 'none',
        )
      })
    })

    describe(`popUp`, () => {
      it(`should set the visibility to hidden`, () => {
        expect(parse({ type: 'popUp' }).style).to.have.property(
          'visibility',
          'hidden',
        )
      })
    })

    describe(`scrollView`, () => {
      it(`should set the display to "block"`, () => {
        expect(parse({ type: 'scrollView' }).style).to.have.property(
          'display',
          'block',
        )
      })
    })

    describe(`textView`, () => {
      it(`should set the default "rows" to 10`, () => {
        expect(parse({ type: 'textView' }).style).to.have.property('rows', 10)
      })
    })

    describe(`video`, () => {
      it(`should set objectFit to "contain"`, () => {
        expect(parse({ type: 'video' }).style).to.have.property(
          'objectFit',
          'contain',
        )
      })
    })
  })
})

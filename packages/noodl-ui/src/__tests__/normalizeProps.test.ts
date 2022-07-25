import { expect } from 'chai'
import { waitFor } from '@testing-library/dom'
import sinon from 'sinon'
import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import * as i from '../utils/internal'
import * as s from '../utils/style'
import {
  assetsUrl,
  baseUrl,
  getDefaultViewportWidthHeight,
  nui,
  ui,
} from '../utils/test-utils'
import NuiPage from '../Page'
import log from '../utils/log'
import normalizeProps from '../normalizeProps'
import { presets } from '../constants'

const parse = (comp: any, opts?: Parameters<typeof normalizeProps>[2]) =>
  normalizeProps({}, comp, { viewport: { width: 375, height: 667 }, ...opts })

describe('normalizeProps', () => {
  describe(`dataKey`, () => {
    it(`[textField] should set value on data-value`, () => {
      const opts = {
        root: { SignIn: { formData: { password: '123' } } },
        pageName: 'SignIn',
      }
      expect(
        parse(ui.textField({ dataKey: 'formData.password' }), opts),
      ).to.have.property('data-value', '123')
      expect(
        parse(ui.textField({ dataKey: 'SignIn.formData.password' }), opts)[
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
        parse(ui.label({ dataKey: 'formData.password' }), opts),
      ).to.have.property('data-value', '123')
      expect(
        parse(ui.label({ dataKey: 'SignIn.formData.password' }), opts)[
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
        expect(parse(ui.view({ [key]: ref }), opts)).to.have.property(
          key,
          value,
        )
      })
    }
  })

  describe(`select`, () => {
    let root: Record<string, any>
    let normalize = (comp: Partial<nt.SelectComponentObject>) =>
      parse(ui.select(comp), { root, pageName: 'SignIn' })

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
        ui.select({ dataKey: '..profile.options', options: '' }),
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
        parse(ui.select({ options: '.SignIn.profile.options' }), {
          root: { SignIn: { profile: { options: ['1AM', '2AM', '3AM'] } } },
          pageName: 'SignIn',
        }),
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
              parse(ui.button({ style: { axis: 'horizontal' } })).style,
            ).to.satisfy((s) => s.display === 'flex' && s.flexWrap === 'nowrap')
          },
        )

        it(
          `should change { axis: 'vertical' } to ` +
            `{ display: 'flex', flexDirection: 'column' }`,
          () => {
            expect(
              parse(ui.button({ style: { axis: 'vertical' } })).style,
            ).to.satisfy(
              (s: any) => s.display === 'flex' && s.flexDirection === 'column',
            )
          },
        )

        it(`should remove the property after being consumed`, () => {
          expect(
            parse(ui.button({ style: { axis: 'vertical' } })).style,
          ).not.to.have.property('axis')
        })
      })

      const leftCenterRightKeys = ['left', 'center', 'right'] as const

      it(`should change { textAlign: 'centerX' } to { textAlign: 'center' }`, () => {
        const component = parse(ui.button({ style: { textAlign: 'centerX' } }))
        expect(component.style).to.have.property('textAlign', 'center')
      })

      describe(`{ textAlign: 'centerY' }`, () => {
        it(`should change to { display: 'flex', alignItems: 'center' }`, () => {
          expect(
            parse(ui.button({ style: { textAlign: 'centerY' } })).style,
          ).to.satisfy((s) => s.display === 'flex' && s.alignItems === 'center')
        })

        it(`should delete the textAlign property`, () => {
          expect(
            parse(ui.button({ style: { textAlign: 'centerY' } })).style,
          ).not.to.have.property('textAlign')
        })
      })

      leftCenterRightKeys.forEach((key) => {
        it(`should change { textAlign: '${key}' } to { textAlign: '${key}' }`, () => {
          expect(parse(ui.button({ style: { textAlign: key } })).style)
            .to.have.property('textAlign')
            .eq(key)
        })
      })

      it(`should change { textAlign: { x: 'left' } } to { textAlign: 'left' }`, () => {
        expect(parse(ui.button({ style: { textAlign: { x: 'left' } } })).style)
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
              const { style } = parse(
                ui.button({
                  style: { textAlign: { x: key, y: 'center' } },
                }),
              )
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
      u.keys(presets.border).forEach((borderPresetKey) => {
        it(`should apply the styles from the border preset "${borderPresetKey}"`, () => {
          expect(
            parse(ui.textField({ style: { border: borderPresetKey as any } }))
              .style,
          ).to.satisfy((s) => u.entries(s).every(([k, v]) => s[k] === v))
        })
      })

      it(`should format the borderColor to hex format`, () => {
        expect(
          parse(ui.textField({ style: { border: { color: '0x33004433' } } }))
            .style,
        ).to.have.property('borderColor', '#33004433')
      })

      it(`should set the borderStyle to the value of border.line`, () => {
        expect(
          parse(ui.textField({ style: { border: { line: 'thin' } } })).style,
        ).to.have.property('borderStyle', 'thin')
      })

      it(`should set the borderWidth to the value of border.width`, () => {
        expect(
          parse(ui.textField({ style: { border: { width: 'thin' } } })).style,
        ).to.have.property('borderWidth', 'thin')
      })

      it('should attach px if borderRadius is a number string with no unit', () => {
        let result = parse(ui.textField({ style: { borderRadius: '0' } }))
        expect(result.style.borderRadius).to.eq('0px')
        result = parse(ui.textField({ style: { borderRadius: '12' } }))
        expect(result.style.borderRadius).to.eq('12px')
      })

      it('should attach px if borderWidth is a number string with no unit', () => {
        let result = parse(ui.textField({ style: { borderWidth: '0' } }))
        expect(result.style.borderWidth).to.eq('0px')
        result = parse(ui.textField({ style: { borderWidth: '12' } }))
        expect(result.style.borderWidth).to.eq('12px')
      })
    })

    describe(`Color`, () => {
      it('should rename textColor to color and remove textColor', () => {
        const result = parse(ui.view({ style: { textColor: '0x33445566' } }))
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
        const result = parse(ui.view({ style }))
        expect(result.style?.abc).to.eq('#33210299')
        u.keys(style).forEach((k) => {
          if (k !== 'textColor') {
            expect(result.style).to.have.property(k, '#33210299')
          }
        })
      })
    })

    describe(`Display`, () => {
      it(`should always keep { display: 'inline' } if it was provided`, () => {
        expect(
          ui.button({ style: { display: 'inline' } }).style,
        ).to.have.property('display', 'inline')
      })
    })

    describe(`fontSize`, () => {
      it(`should always append px`, () => {
        let result = parse(ui.scrollView({ style: { fontSize: '14' } }))
        expect(result.style).to.have.property('fontSize', '14px')
        result = parse(ui.scrollView({ style: { fontSize: '10' } }))
        expect(result.style).to.have.property('fontSize', '10px')
        result = parse(ui.scrollView({ style: { fontSize: 10 } as any }))
        expect(result.style).to.have.property('fontSize', '10px')
        result = parse(ui.scrollView({ style: { fontSize: 0 } as any }))
        expect(result.style).to.have.property('fontSize', '0px')
      })

      const getComponent = (fontSize: string) =>
        ui.button({ style: { fontSize } })

      const getOptions = (opts?: Parameters<typeof normalizeProps>[2]) => ({
        viewport: getDefaultViewportWidthHeight(),
        ...opts,
      })

      describe(`vw/vh`, () => {
        it(`should return back the original value if viewport dimensions are missing`, () => {
          expect(
            normalizeProps({}, getComponent('2.8vh')).style,
          ).to.have.property('fontSize', '2.8vh')
        })

        it(`should set the right size`, () => {
          const fontSize = parse(getComponent('2.8vh'), getOptions())?.style
            ?.fontSize
          expect(s.toNum(fontSize, 1)).to.eq(21.5)
        })

        it(`should set the right size from local references`, () => {
          const fontSize = parse(
            getComponent('..f'),
            getOptions({ pageName: 'Topo', root: { Topo: { f: '2.8vh' } } }),
          )?.style?.fontSize
          expect(s.toNum(fontSize, 1)).to.eq(21.5)
        })

        it(`should set the right size from root references`, () => {
          const fontSize = parse(
            getComponent('.Topo.f'),
            getOptions({ pageName: 'Topo', root: { Topo: { f: '2.8vh' } } }),
          )?.style?.fontSize
          expect(s.toNum(fontSize, 2)).to.eq(21.5)
        })

        it(`should return the value in vw/vh if keepVpUnit === true`, () => {
          const fontSize = parse(
            getComponent('.Topo.f'),
            getOptions({
              pageName: 'Topo',
              root: { Topo: { f: '4vh' } },
              viewport: { height: 768, width: 1024 },
            }),
          )?.style?.fontSize
          log.info(fontSize)
        })
      })

      describe(`fontSize references`, () => {
        let page: NuiPage
        let root: Record<string, any>

        beforeEach(() => {
          page = nui.getRootPage()
          page.page = 'Topo'
          root = {
            Nfont: { h1: '1.6vh' },
            Sfont: { h4: '4.5vh' },
            Topo: {
              font1: '.Nfont.h1',
              components: [
                ui.label({
                  viewTag: 'helloTag',
                  style: { top: '0.0125', left: '0.05', fontSize: '.Sfont.h4' },
                }),
                ui.view({
                  style: { fontSize: '..font1' },
                }),
              ],
            },
          }
        })

        it(`should correctly resolve fontSize references`, () => {
          const [label1, list1] = root.Topo.components.map((c) =>
            parse(c, { pageName: 'Topo', root }),
          )
          expect(label1.style).to.have.property('fontSize', `${30.015}px`)
          expect(list1.style).to.have.property('fontSize', `${10.672}px`)
        })

        it(`should keep the values in vp unit if keepVpUnit === true`, () => {
          let componentObject = ui.label({ style: { fontSize: '2.8vh' } })
          let component = parse(componentObject)
          expect(component.style).to.have.property('fontSize', '18.676px')
          component = parse(componentObject, { keepVpUnit: true })
          expect(component.style).to.have.property('fontSize', `calc(2.8vh)`)
        })
      })
    })

    describe(`fontWeight`, () => {
      it('should return a fontWeight with bold if fontStyle was bold', () => {
        const result = parse(ui.scrollView({ style: { fontStyle: 'bold' } }))
        expect(result.style).to.have.property('fontWeight', 'bold')
        expect(result.style).not.to.have.property('fontStyle')
      })
    })

    describe(`Positioning`, () => {
      it('should append the unit if missing', () => {
        let result = parse(ui.video({ style: { top: '0' } }))
        expect(result.style).to.have.property('top', '0px')
        result = parse(ui.video({ style: { left: '0' } }))
        expect(result.style).to.have.property('left', '0px')
      })

      it('should change to "667px" for top and "375px" for left', () => {
        let result = parse(ui.video({ style: { top: '1' } }))
        expect(result.style).to.have.property('top', '667px')
        result = parse(ui.video({ style: { left: '1' } }))
        expect(result.style).to.have.property('left', '375px')
      })

      it('should get correct results for decimal strings like "0.23"', () => {
        let result = parse(ui.video({ style: { top: '0.23' } }))
        expect(result.style).to.have.property('top', '153.41px')
        result = parse(ui.video({ style: { left: '0.89' } }))
        expect(result.style).to.have.property('left', '333.75px')
      })
    })

    describe(`Sizes`, () => {
      // '0.45' --> '168.75px'
      it('should return the string decimal as px', () => {
        let result = parse(ui.select({ style: { width: '0.45' } }))
        expect(result.style).to.have.property('width', '168.75px')
        result = parse(ui.select({ style: { height: '0.29' } }))
        expect(result.style).to.have.property('height', '193.43px')
      })

      // '23px' --> '23px'
      it('should return the same value if px was already appended', () => {
        const style = { width: '23px', height: '0.27px' }
        const result = parse(ui.select({ style }))
        expect(result.style).to.have.property('width', '23px')
        expect(result.style).to.have.property('height', '0.27px')
      })

      // '0' --> 0
      it('should return a value of 0 and append px to it', () => {
        const style = { width: '0', height: '0' }
        const result = parse(ui.select({ style }))
        expect(result.style.width).to.equal('0px')
        expect(result.style.height).to.equal('0px')
      })

      // '1' --> 375px
      it('should just return the viewport size with px appended if value is "1"', () => {
        const style = { width: '1', height: '1' }
        const result = parse(ui.select({ style }))
        expect(result.style.width).to.equal('375px')
        expect(result.style.height).to.equal('667px')
      })

      // 1 --> '375px'
      it('should return the the size with px appended if value is a number 1', () => {
        let result = parse(ui.select({ style: { width: 1 } as any }))
        expect(result.style.width).to.equal('375px')
        result = parse(ui.select({ style: { height: 1 } as any }))
        expect(result.style.height).to.equal('667px')
      })

      // 0 --> '0px'
      it('should keep it at 0 but convert to string and append px', () => {
        const result = parse(
          ui.select({ style: { width: 0, height: 0 } as any }),
        )
        expect(result.style.width).to.equal('0px')
        expect(result.style.height).to.equal('0px')
      })

      // 35 --> 35px
      it('should return the value with px appended', () => {
        const result = parse(
          ui.select({ style: { width: 38, height: 203 } as any }),
        )
        expect(result.style.width).to.equal('38px')
        expect(result.style.height).to.equal('203px')
      })

      // 0.45 --> '168.75px'
      it('should treat 0.45 as "0.45" (divide by total viewport size)', () => {
        const result = parse(
          ui.select({ style: { width: 0.45, height: 0.23 } as any }),
        )
        expect(result.style.width).to.equal('168.75px')
        expect(result.style.height).to.equal('153.41px')
      })
    })

    describe(`Visibility`, () => {
      it('should turn visibility to hidden if "isHidden" is true', () => {
        expect(
          parse(ui.image({ style: { isHidden: true } })).style,
        ).to.have.property('visibility', 'hidden')
      })
    })
  })

  describe(`Component specific`, () => {
    describe(`header`, () => {
      it(`should set zIndex to 100`, () => {
        expect(parse(ui.header()).style).to.have.property('zIndex', 100)
      })
    })

    describe(`image`, () => {
      it(
        `should remove the "height" if it does not explicitly have ` +
          `a height set to maintain the aspect ratio`,
        () => {
          expect(parse(ui.image()).style).not.to.have.property('height')
        },
      )

      it(`should set objectFit to "contain"`, () => {
        expect(parse(ui.image()).style).to.have.property('objectFit', 'contain')
      })
    })

    describe(`list`, () => {
      it(`should disable listStyle and padding`, () => {
        const styles = parse(ui.list()).style
        expect(styles).to.have.property('listStyle', 'none')
        expect(styles).to.have.property('padding', '0px')
      })
    })

    describe(`listItem`, () => {
      it(`should remove listStyle and set padding to 0`, () => {
        expect(parse(ui.listItem({})).style).to.satisfy(
          (s) => s.listStyle === 'none',
        )
      })
    })

    describe(`popUp`, () => {
      it(`should set the visibility to hidden`, () => {
        expect(parse(ui.popUpComponent()).style).to.have.property(
          'visibility',
          'hidden',
        )
      })
    })

    describe(`scrollView`, () => {
      it(`should set the display to "block"`, () => {
        expect(parse(ui.scrollView()).style).to.have.property(
          'display',
          'block',
        )
      })
    })

    describe(`textView`, () => {
      it(`should set the default "rows" to 10`, () => {
        expect(parse(ui.textView()).style).to.have.property('rows', 10)
      })
    })

    describe(`video`, () => {
      it(`should set objectFit to "contain"`, () => {
        expect(parse(ui.video()).style).to.have.property('objectFit', 'contain')
      })
    })
  })
})

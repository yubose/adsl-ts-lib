import { expect } from 'chai'
import { toNode } from '../utils/yml'
import { hasPlaceholder, listPlaceholders } from '../utils/parse'
import { replacePlaceholder, replacePlaceholders } from '../utils/replace'

describe(`utils`, () => {
  describe(`loadFile`, () => {
    xit(``, () => {
      //
    })
  })

  it(`should return true if a string has one or more placeholders`, () => {
    const str = '${cadlBaseUrl}assets/${designSuffix} . ${abc}'
    expect(hasPlaceholder(str)).to.be.true
  })

  it(`should return all the placeholders available`, () => {
    const str = '${cadlBaseUrl}assets/${designSuffix} . ${abc}'
    const placeholders = listPlaceholders(str)
    expect(placeholders).to.have.lengthOf(3)
    expect(placeholders).to.have.all.members([
      'cadlBaseUrl',
      'designSuffix',
      'abc',
    ])
  })

  describe(`replacePlaceholder`, () => {
    it(`should replace \${cadlBaseUrl}`, () => {
      const cadlVersion = 'abc123.41'
      const result = replacePlaceholder(
        '${cadlVersion}',
        cadlVersion,
        'https://public.aitmed.com/cadl/www${cadlVersion}${designSuffix}/',
      )
      expect(result).to.eq(
        `https://public.aitmed.com/cadl/www${cadlVersion}\${designSuffix}/`,
      )
    })
  })

  describe(`replacePlaceholders`, () => {
    describe(`when given an object of values`, () => {
      it(`should replace all placeholders from object literals`, () => {
        const apiHost = 'albh2.aitmed.io'
        const cadlBaseUrl =
          'https://public.aitmed.com/cadl/wwwv4.18/_${apiHost}'
        const cadlVersion = 'epic'
        const obj = {
          hello: [
            {
              greeting1: 'Hi!',
              greeting2:
                'https://public.aitmed.com/cadl/www${cadlVersion}${designSuffix}/',
            },
          ],
          age: 13,
          views: {
            modern: 'classic ${cadlBaseUrl}',
            food: cadlBaseUrl,
            zeus: 'google ${width}..=-  ',
            atheus: '${height}',
            list: [{ child1: 'bob' }, { child2: '${apiHost}' }],
          },
        }
        replacePlaceholders(obj, {
          apiHost,
          cadlVersion,
          cadlBaseUrl,
          width: '10px',
          height: '10px',
        })
        expect(obj.hello[0].greeting2).to.eq(
          `https://public.aitmed.com/cadl/www${cadlVersion}\${designSuffix}/`,
        )
        expect(obj.views.food).to.eq(
          `https://public.aitmed.com/cadl/wwwv4.18/_${apiHost}`,
        )
        expect(obj.views.zeus).to.eq('google 10px..=-  ')
        expect(obj.views.atheus).to.eq('10px')
        expect(obj.views.list[1].child2).to.eq(apiHost)
      })

      it(`should replace all placeholders from YAML nodes`, () => {
        const apiHost = 'albh2.aitmed.io'
        const cadlBaseUrl =
          'https://public.aitmed.com/cadl/wwwv4.18/_${apiHost}'
        const cadlVersion = 'epic'
        const node = toNode({
          hello: [
            {
              greeting1: 'Hi!',
              greeting2:
                'https://public.aitmed.com/cadl/www${cadlVersion}${designSuffix}/',
            },
          ],
          age: 13,
          views: {
            modern: 'classic ${cadlBaseUrl}',
            food: cadlBaseUrl,
            zeus: 'google ${width}..=-  ',
            atheus: '${height}',
            mortal: 'i.i  ${width}${height}  ',
            list: [{ child1: 'bob' }, { child2: '${apiHost}' }],
          },
        })
        replacePlaceholders(node, {
          apiHost,
          cadlVersion,
          cadlBaseUrl,
          width: '10px',
          height: '11px',
        })
        expect(node.getIn(['hello', 0, 'greeting2'], false)).to.eq(
          'https://public.aitmed.com/cadl/wwwepic${designSuffix}/',
        )
        expect(node.getIn(['views', 'food'], false)).to.eq(
          `https://public.aitmed.com/cadl/wwwv4.18/_${apiHost}`,
        )
        expect(node.getIn(['views', 'zeus'], false)).to.eq('google 10px..=-  ')
        expect(node.getIn(['views', 'atheus'], false)).to.eq('11px')
        expect(node.getIn(['views', 'mortal'], false)).to.eq('i.i  10px11px  ')
        expect(node.getIn(['views', 'list', 1, 'child2'], false)).to.eq(apiHost)
      })
    })
  })
})

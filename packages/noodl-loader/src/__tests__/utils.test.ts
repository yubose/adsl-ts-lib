import path from 'path'
import { expect } from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import y from 'yaml'
import { toNode } from '../utils/yml'
import { replacePlaceholder, replacePlaceholders } from '../utils/replace'

describe(`utils`, () => {
  describe(`loadFile`, () => {
    xit(``, () => {
      //
    })
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

  describe.only(`replacePlaceholders`, () => {
    it(`should replace all placeholders from YAMLMap nodes`, () => {
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
          modern: 'classic',
        },
      })
      node.setIn(
        ['hello', 0, 'greeting2'],
        replacePlaceholders(node, { cadlVersion: 'epic' }),
      )
      const result = node.getIn(['hello', 0, 'greeting2'], false)

      console.dir(node.getIn(['hello', 0, 'greeting2']), { depth: Infinity })

      expect(result).to.eq(
        'https://public.aitmed.com/cadl/wwwepic${designSuffix}/',
      )
    })
  })
})

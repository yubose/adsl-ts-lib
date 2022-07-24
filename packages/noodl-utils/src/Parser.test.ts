import * as u from '@jsmanifest/utils'
import * as nt from 'noodl-types'
import { expect } from 'chai'
import Parser from './Parser'

const parse = new Parser()

const rootConfig = {
  cadlBaseUrl: 'https://public.aitmed.com/cadl/meet3_${cadlVersion}/',
  cadlMain: 'cadlEndpoint.yml',
  web: { cadlVersion: { stable: '0.5d', test: '0.5d' } },
  ios: { cadlVersion: { stable: '0.5d', test: '0.5d' } },
  android: { cadlVersion: { stable: '0.5d', test: '0.5d' } },
} as nt.RootConfig

const parsedBaseUrl = `https://public.aitmed.com/cadl/meet3_0.5d/`
const parsedCadlEndpoint = parsedBaseUrl + rootConfig.cadlMain

describe(u.yellow(`Parser`), () => {
  describe(u.italic(`appConfigUrl`), () => {
    it(`should support using a rootConfig object`, () => {
      expect(parse.appConfigUrl(rootConfig, 'web', 'test')).to.eq(
        parsedCadlEndpoint,
      )
    })

    it(`should support using the baseUrl`, () => {
      expect(
        parse.appConfigUrl(
          rootConfig.cadlBaseUrl,
          rootConfig.cadlMain,
          '0.100d',
        ),
      ).to.eq(
        `https://public.aitmed.com/cadl/meet3_0.100d/${rootConfig.cadlMain}`,
      )
    })
  })

  describe(u.italic('destination'), () => {
    u.entries({
      '^RedTag': {
        msg: `should result to { isSamePage: true, id: 'RedTag' }`,
        props: { isSamePage: true, id: 'RedTag', destination: '' },
      },
      GotoSignIn: {
        msg: `should result to { isSamePage: false, id: '' }`,
        props: { isSamePage: false, id: '', destination: 'GotoSignIn' },
      },
      'Soda^RedTag': {
        msg: `should result to { isSamePage: false, id: 'RedTag' }`,
        props: { isSamePage: false, id: 'RedTag', destination: 'Soda' },
      },
      'TestSearch@TestTypePage#iframeTag': {
        msg: `should result to: { targetPage: 'TestSearch', currentPage: 'TestTypePage', viewTagA: 'iframeTag' }`,
        props: {
          targetPage: 'TestSearch',
          currentPage: 'TestTypePage',
          viewTag: 'iframeTag',
        },
      },
    }).forEach(([destination, { msg, props }]: any) => {
      it(msg, () => {
        const obj = parse.destination(destination)
        u.entries(props).forEach((key, value) =>
          expect(obj[key as any]).to.eq(value),
        )
      })
    })
  })

  describe(u.italic(`queryString`), () => {
    u.entries({
      RedTag: {
        msg: `should result to %s from %dest`,
        result: `index.html?RedTag`,
      },
    }).forEach(([destination, { msg, result }]) => {
      it(msg.replace('%dest', destination).replace('%s', result), () => {
        const pageUrl = parse.queryString({
          destination,
          pageUrl: 'index.html?',
          startPage: 'SignIn',
        })
        expect(pageUrl).to.eq(result)
      })
    })
  })
})

import y from 'yaml'
import { expect } from 'chai'
import { fs } from 'memfs'
import { fetchYml, toJson } from '../utils/yml'
import * as h from './helpers'
import * as c from '../constants'

describe(`helpers`, () => {
  describe(`createConfig`, () => {
    it(`should default cadlMain to cadlEndpoint.yml`, () => {
      expect(h.createConfig('json')).to.have.property(
        'cadlMain',
        'cadlEndpoint.yml',
      )
    })

    it(`should return yml if type is "yml" or was not given`, () => {
      expect(h.createConfig()).to.be.a('string')
    })

    it(`should return a YAML Document if type is "doc"`, () => {
      expect(h.createConfig('doc')).to.be.instanceOf(y.Document)
    })

    it(`should overwrite the cadlMain if given`, () => {
      expect(h.createConfig('json', { cadlMain: 'abc.yml' })).to.have.property(
        'cadlMain',
        'abc.yml',
      )
    })
  })

  describe(`createConfigUri`, () => {
    it(`should append the pathname and return the full config uri`, () => {
      expect(h.createConfigUri('www')).to.eq(c.baseRemoteConfigUrl + '/www.yml')
      expect(h.createConfigUri('www.yml')).to.eq(
        c.baseRemoteConfigUrl + '/www.yml',
      )
    })
  })

  describe(`createCadlEndpoint`, () => {
    it(`should default preload and page to empty array`, () => {
      const cadlEndpointObject = h.createCadlEndpoint('json')
      expect(cadlEndpointObject).to.have.property('preload').to.be.an('array')
      expect(cadlEndpointObject).to.have.property('page').to.be.an('array')
    })

    it(`should return yml if "as" is "yml" or was not given`, () => {
      expect(h.createCadlEndpoint()).to.be.a('string')
    })

    it(`should return a YAML Document if "as" is "doc"`, () => {
      expect(h.createCadlEndpoint('doc')).to.be.instanceOf(y.Document)
    })
  })

  describe(`createMockEndpoints`, () => {
    it(`should return config endpoint`, () => {
      const endpoints = h.createMockEndpoints({
        baseUrl: 'http://127.0.0.1:9000/',
        configKey: 'www',
      })
      expect(endpoints).to.have.property(`${c.baseRemoteConfigUrl}/www.yml`)
    })

    it(`should return cadlEndpoint endpoint`, () => {
      const endpoints = h.createMockEndpoints({
        baseUrl: 'http://127.0.0.1:9000/',
      })
      expect(endpoints).to.have.property(
        `http://127.0.0.1:9000/cadlEndpoint.yml`,
      )
    })

    it(`should return preload endpoints`, () => {
      const endpoints = h.createMockEndpoints({
        baseUrl: 'http://127.0.0.1:9000/',
        preload: ['BaseCSS', 'BasePage', ['BaseMessage', { Hello: 123 }]],
        pages: [],
      })
      expect(endpoints).to.have.property(`http://127.0.0.1:9000/BaseCSS.yml`)
      expect(endpoints).to.have.property(`http://127.0.0.1:9000/BasePage.yml`)
      expect(endpoints)
        .to.have.property(`http://127.0.0.1:9000/BaseMessage.yml`)
        .to.have.property('response')
        .to.deep.eq(
          y.stringify(
            y.parse(
              endpoints['http://127.0.0.1:9000/BaseMessage.yml'].response,
            ),
          ),
        )
    })

    it(`should return page endpoints`, () => {
      const endpoints = h.createMockEndpoints({
        baseUrl: 'http://127.0.0.1:9000/',
        pages: ['SignIn', ['Dashboard', { Hello: 123 }]],
      })
      expect(endpoints).to.have.property(`http://127.0.0.1:9000/SignIn.yml`)
      expect(endpoints)
        .to.have.property(`http://127.0.0.1:9000/Dashboard.yml`)
        .to.have.property('response')
        .to.deep.eq(
          y.stringify(
            y.parse(endpoints['http://127.0.0.1:9000/Dashboard.yml'].response),
          ),
        )
    })
  })

  describe(`getLoadFileOptions`, () => {
    it(`should return mode as 'file`, () => {
      expect(h.getLoadFileOptions()).to.have.property('mode', 'file')
    })

    it(`should return dir defaulted to "generated/\${configKey}"`, () => {
      expect(h.getLoadFileOptions()).to.have.property(
        'dir',
        `generated/${h.configKey}`,
      )
    })
  })

  describe(`mockPaths`, () => {
    describe(`when type === 'file`, () => {
      it(`should proxy config, cadlEndpoint, preload, and pages`, () => {
        const configKey = 'www'
        h.mockPaths({
          configKey,
          preload: [['BaseMessage', { Message: {} }]],
          pages: [['Dashboard', { Style: { shadow: 'true' } }]],
          type: 'file',
        })
        const prefix = `generated/${configKey}/`
        const config = toJson(
          fs.readFileSync(`./generated/${configKey}/www.yml`),
        )
        const cadlEndpoint = toJson(
          fs.readFileSync(`${prefix}/cadlEndpoint.yml`),
        )
        const BaseMessage = toJson(fs.readFileSync(`${prefix}/BaseMessage.yml`))
        const Dashboard = toJson(fs.readFileSync(`${prefix}/Dashboard.yml`))
        expect(config)
          .to.be.an('object')
          .to.have.property('cadlBaseUrl', h.baseUrl)
        expect(cadlEndpoint).to.have.property('preload')
        expect(cadlEndpoint).to.have.property('page')
        expect(Dashboard)
          .to.have.property('Style')
          .to.have.property('shadow')
          .to.eq('true')
        expect(BaseMessage).to.deep.eq({ Message: {} })
      })
    })

    describe(`when type === 'url'`, () => {
      it(`should proxy config, cadlEndpoint, preload, and pages`, async () => {
        h.mockPaths({
          configKey: 'www',
          preload: [['BaseMessage', { Message: {} }]],
          pages: [['Dashboard', { Style: { shadow: 'true' } }]],
          type: 'url',
        })

        const config = await fetchYml(
          `${c.baseRemoteConfigUrl}/www.yml`,
          'json',
        )
        const cadlEndpoint = await fetchYml(
          `${h.baseUrl}cadlEndpoint.yml`,
          'json',
        )
        const BaseMessage = await fetchYml(
          `${h.baseUrl}BaseMessage.yml`,
          'json',
        )
        const Dashboard = await fetchYml(`${h.baseUrl}Dashboard.yml`, 'json')

        expect(config)
          .to.be.an('object')
          .to.have.property('cadlBaseUrl', h.baseUrl)
        expect(cadlEndpoint).to.have.property('preload')
        expect(cadlEndpoint).to.have.property('page')
        expect(Dashboard)
          .to.have.property('Style')
          .to.have.property('shadow')
          .to.eq('true')
        expect(BaseMessage).to.deep.eq({ Message: {} })
      })
    })

    it(`should parse through placeholders`, async () => {
      const configKey = 'www'
      const cadlVersion = 0.33
      const appKey = 'myCadlEndpoint.yml'
      const apiHost = 'abc.aitmed.io'
      const apiPort = 500
      const baseUrl = `http://127.0.0.1:3001/cadl/${configKey}${cadlVersion}/`
      const preload = ['BasePage', 'BaseCSS']
      const pages = ['SignIn', 'Dashboard']
      const mockResults = h.mockPaths({
        assetsUrl: `\${cadlBaseUrl}assets`,
        baseUrl: `http://127.0.0.1:3001/cadl/${configKey}\${cadlVersion}/`,
        configKey: [
          configKey,
          h.createConfig({ apiHost, apiPort, cadlMain: appKey }),
        ],
        preload: [preload[0], [preload[1], { Style: { top: '0.1' } }]],
        pages: [pages[0], [pages[1], { components: [] }]],
        placeholders: {
          cadlVersion,
        },
        type: 'url',
      })
      for (const endpoint of Object.keys(mockResults.endpoints || {})) {
        const pathname = endpoint.substring(endpoint.lastIndexOf('/') + 1)
        expect(endpoint).to.eq(`${baseUrl}${pathname}`)
      }
    })
  })

  describe(`nockRequest`, () => {
    it(`should proxy with default baseURL`, async () => {
      const pathname = '/api/v1'
      const endpoint = h.nockRequest(pathname, 'hello123')
      const result = await fetchYml(endpoint)
      expect(result).to.eq('hello123')
    })

    it(`should proxy with custom baseURL`, async () => {
      const pathname = '/api/v1'
      const endpoint = h.nockRequest('http://localhost:3001', pathname, 'water')
      const result = await fetchYml(endpoint)
      expect(result).to.eq('water')
    })
  })

  describe(`nockConfigRequest`, () => {
    it(`should proxy config yml`, async () => {
      const endpoint = h.nockConfigRequest()
      const result = await fetchYml(endpoint)
      const configObject = y.parse(result)
      expect(configObject).to.be.an('object')
      expect(configObject).to.have.property('cadlBaseUrl', h.baseUrl)
      expect(configObject).to.have.property('cadlMain', 'cadlEndpoint.yml')
    })

    it(`should proxy with a custom configKey`, async () => {
      const endpoint = h.nockConfigRequest('www')
      const result = await fetchYml(endpoint)
      const configObject = y.parse(result)
      expect(configObject).to.be.an('object')
      expect(configObject).to.have.property('cadlBaseUrl', h.baseUrl)
      expect(configObject).to.have.property('cadlMain', 'cadlEndpoint.yml')
      expect(endpoint.endsWith('www.yml')).to.be.true
    })
  })

  describe(`nockCadlEndpointRequest`, () => {
    it(`should proxy cadlEndpoint yml`, async () => {
      const { endpoint } = h.nockCadlEndpointRequest()
      const result = await fetchYml(endpoint)
      const cadlEndpoint = y.parse(result)
      expect(cadlEndpoint).to.be.an('object')
      expect(cadlEndpoint).to.have.property('assetsUrl', h.assetsUrl)
      expect(cadlEndpoint).to.have.property('baseUrl', h.baseUrl)
      expect(cadlEndpoint).to.have.property('preload').to.be.an('array')
      expect(cadlEndpoint).to.have.property('page').to.be.an('array')
    })

    it(`should proxy cadlEndpoint yml with the object`, async () => {
      const assetsUrl = 'http://fff.com/assets/'
      const baseUrl = 'http://fff.com/'
      h.mockPaths({
        assetsUrl,
        baseUrl,
        configKey: 'www',
        preload: ['BaseCSS'],
        pages: ['SignIn', 'AiTmedContact'],
      })
      const result = await fetchYml(`${baseUrl}cadlEndpoint.yml`)
      const cadlEndpoint = y.parse(result)
      expect(cadlEndpoint).to.be.an('object')
      expect(cadlEndpoint).to.have.property('assetsUrl', assetsUrl)
      expect(cadlEndpoint).to.have.property('baseUrl', baseUrl)
      expect(cadlEndpoint)
        .to.have.property('preload')
        .to.include.members(['BaseCSS'])
      expect(cadlEndpoint)
        .to.have.property('page')
        .to.include.members(['SignIn', 'AiTmedContact'])
    })

    it(`should proxy cadlEndpoint yml with the included preload/pages args`, async () => {
      const { endpoint } = h.nockCadlEndpointRequest(
        ['BaseCSS'],
        ['SignIn', 'AiTmedContact'],
      )
      const result = await fetchYml(endpoint)
      const cadlEndpoint = y.parse(result)
      expect(cadlEndpoint).to.be.an('object')
      expect(cadlEndpoint)
        .to.have.property('preload')
        .to.include.members(['BaseCSS'])
      expect(cadlEndpoint)
        .to.have.property('page')
        .to.include.members(['SignIn', 'AiTmedContact'])
    })
  })
})

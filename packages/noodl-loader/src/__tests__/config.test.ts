import { expect } from 'chai'
import Config from '../config'

let config: Config

beforeEach(() => {
  config = new Config()
})

describe(`Config`, () => {
  it(`should format the timestamp to MMDDYY.am`, () => {
    expect(config.getTimestamp()).to.match(
      new RegExp(`[0-9]{5,6}\.[ampAMP]{0,2}`),
    )
  })

  it(`should return an object of all the key/values`, () => {
    expect(config.toJSON()).to.have.all.keys('cadlMain', 'timestamp')
    const result = config
      .set('apiHost', 'abc')
      .set('apiPort', 443)
      .set('keywords', ['hello', 'goodbye'])
      .toJSON()
    expect(result).to.have.property('apiHost', 'abc')
    expect(result).to.have.property('apiPort', 443)
    expect(result).to.have.deep.property('keywords', ['hello', 'goodbye'])
  })

  describe(`resolve`, () => {
    it(`should resolve the version when device type is set`, () => {
      config.set('android', { cadlVersion: { stable: 0.3 } })
      expect(config.resolve('version', 'android')).to.eq(0.3)
    })

    it(`should return an object with all placeholders replaced with their values if no args were passedi n`, () => {
      config.set('apiHost', 'albh2.aitmed.io')
      config.set('apiPort', 445)
      config.set('appApiHost', 'apiHost')
      config.set('webApiHost', 'apiHost')
      config.set(
        'cadlBaseUrl',
        'https://127.0.0.1:${apiPort}/www${cadlVersion}${designSuffix}/',
      )
      config.set('designSuffix', 'png')
      config.set('web', { cadlVersion: { stable: 0.2, test: 0.1 } })
      const result = config.resolve()
      expect(result).to.be.an('object')
      expect(result).to.have.property('appApiHost', 'albh2.aitmed.io')
      expect(result).to.have.property('webApiHost', 'albh2.aitmed.io')
      expect(result).to.have.property(
        'cadlBaseUrl',
        'https://127.0.0.1:445/www0.2png/',
      )
      expect(result).to.have.property('designSuffix', 'png')
    })

    it(`should resolve cadlBaseUrl`, () => {
      config.set('apiHost', 'albh2.aitmed.io')
      config.set('apiPort', '443')
      config.set('cadlMain', 'cadlEndpoint.yml')
      config.set('cadlBaseUrl', 'http://${apiHost}:${apiPort}/')
      expect(config.resolve(config.baseUrl)).to.eq(
        'http://albh2.aitmed.io:443/',
      )
    })
  })
})

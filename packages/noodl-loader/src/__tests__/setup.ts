import chai from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import nock from 'nock'

chai.use(chaiAsPromised)
chai.use(sinonChai)

before(() => {
  process.stdout.write('\x1Bc')
})

afterEach(() => {
  nock.cleanAll()
})

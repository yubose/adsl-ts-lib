import Chai from 'chai'
import sinonChai from 'sinon-chai'
import { clearState as clearVisitorState } from '../DocVisitor'

Chai.use(sinonChai)

before(() => {
  process.stdout.write('\x1Bc')
})

afterEach(() => {
  clearVisitorState()
})

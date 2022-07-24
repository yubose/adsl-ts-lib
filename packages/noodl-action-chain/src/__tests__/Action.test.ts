import chalk from 'chalk'
import { expect } from 'chai'
import Action from '../Action'

describe('Action', () => {
  describe('Executing', () => {
    it('should reset the result/error state to their default values', () => {
      const pageJump = { actionType: 'pageJump', destination: 'SignIn' }
      const action = new Action('onClick', pageJump)
      const err = new Error('fsdfd')
      action.error = err
      action.result = 'abc'
      expect(action.error).to.equal(err)
      action.error = null
      expect(action.error).to.be.null
      expect(action.result).to.equal('abc')
      action.execute()
      expect(action.error).to.be.instanceOf(Error)
      expect(action.error).not.to.eq(err)
      expect(action.result).to.be.undefined
    })

    it(`should set status to ${chalk.magenta(
      'resolved',
    )} if the execution was successful`, async () => {
      const pageJump = { actionType: 'pageJump', destination: 'SignIn' }
      const action = new Action('onClick', pageJump)
      action.executor = async () => 'abc'
      const result = await action.execute()
      expect(result).to.eq('abc')
    })
  })

  describe('When failing', () => {
    it('should set the error property to the error if the execution failed', async () => {
      const pageJump = { actionType: 'pageJump', destination: 'SignIn' }
      const action = new Action('onClick', pageJump)
      action.executor = async () => {
        throw new Error('abc')
      }
      try {
        await action.execute()
      } catch (error) {
        expect(action.status).to.eq('error')
        expect(action.error).to.eq(error)
      }
    })
  })

  it('should set status to resolved if the execution was a success (async)', async () => {
    const pageJump = { actionType: 'pageJump', destination: 'SignIn' }
    const action = new Action('onClick', pageJump)
    action.executor = async () => 'abc'
    await action.execute({ abc: 'letters' })
    expect(action.status).to.eq('resolved')
  })
})

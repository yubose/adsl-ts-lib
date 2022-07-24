import { expect } from 'chai'
import chalk from 'chalk'
import sinon from 'sinon'
import Action from '../Action'
import ActionChain from '../ActionChain'
import AbortExecuteError from '../AbortExecuteError'
import { ABORTED, IDLE } from '../constants'
import {
  getActionChain,
  getBuiltInAction,
  getEvalObjectAction,
  getPopUpAction,
  getPopUpDismissAction,
  getSaveObjectAction,
  getUpdateObjectAction,
} from './helpers'
import createAction from '../utils/createAction'
import isAction from '../utils/isAction'

export const coolGold = (...s: any[]) => chalk.keyword('navajowhite')(...s)
export const italic = (...s: any[]) => chalk.italic(chalk.white(...s))
export const magenta = (...s: any[]) => chalk.magenta(...s)

describe(coolGold(`ActionChain`), () => {
  describe(italic(`Generator`), () => {
    it(`should return an ${'AsyncGenerator'}`, () => {
      const ac = getActionChain({
        actions: [getEvalObjectAction()],
        trigger: 'onChange',
      })
      const gen = ActionChain.createGenerator(ac)
      expect(Symbol.asyncIterator in gen).to.be.true
    })

    describe(`Calling ${'next'}`, () => {
      it(`should always return the iterator result in the shape { value, done }`, async () => {
        const ac = getActionChain({
          actions: [getPopUpDismissAction()],
          trigger: 'onChange',
        })
        ac.loadQueue()
        let result = await ac.next()
        expect(result).to.have.property('done')
        expect(result).to.have.property('value')
        result = await ac.next()
        expect(result).to.have.property('done')
        expect(result).to.have.property('value')
      })

      it(`should always attach an action instance as the "value" property on the iterator result`, async () => {
        const ac = getActionChain({
          actions: [getPopUpDismissAction(), getBuiltInAction()],
          trigger: 'onChange',
        })
        ac.loadQueue()
        let result = await ac.next()
        expect(result)
          .to.have.property('value')
          .to.satisfy(() => isAction(result.value))
        result = await ac.next()
        expect(result)
          .to.have.property('value')
          .to.satisfy(() => isAction(result.value))
      })

      it(`should never return the same action in subsequent iterations`, async () => {
        const ac = getActionChain({
          actions: [getPopUpDismissAction(), getBuiltInAction()],
          trigger: 'onHover',
        })
        ac.loadQueue()
        let iteratorResult = await ac.next()
        const firstAction = iteratorResult.value
        iteratorResult = await ac.next()
        const secondAction = iteratorResult.value
        expect(firstAction).not.to.eq(secondAction)
        iteratorResult = await ac.next()
        const thirdAction = iteratorResult.value
        expect(firstAction).not.to.eq(thirdAction)
        expect(secondAction).not.to.eq(thirdAction)
      })

      it(`should pass the result of the previous action's callback as args`, async () => {
        const spy1 = sinon.spy(() => 'hello')
        const ac = getActionChain({
          actions: [{ action: getPopUpDismissAction(), fn: spy1 }],
          trigger: 'onChange',
        })
        const nextSpy = sinon.spy(ac, 'next')
        await ac.execute()
        expect(nextSpy.secondCall.args[0]).to.eq('hello')
        nextSpy.restore()
      })

      describe(`when it is the last item in the generator`, () => {
        it(`should return an array of results of objects in the shape of { action, result }`, async () => {
          const ac = getActionChain({
            actions: [getPopUpDismissAction(), getPopUpAction()],
            trigger: 'onChange',
          })
          const results = await ac.execute()
          expect(results).to.be.an('array').with.lengthOf(2)
          results.forEach((res) => {
            expect(isAction(res.action)).to.be.true
            expect(res).to.have.property('result')
          })
        })
      })
    })
  })

  describe(italic(`Loading`), () => {
    it('should loadQueue up the instances', () => {
      const ac = getActionChain({
        actions: [getBuiltInAction(), getEvalObjectAction()],
        trigger: 'onMouseOver',
      })
      ac.queue.forEach((a) => expect(isAction(a)).to.be.true)
    })
  })

  describe(italic(`Execution`), () => {
    it(`should only invoke the callback once`, async () => {
      const spy = sinon.spy()
      const ac = getActionChain({
        actions: [{ action: getEvalObjectAction(), fn: async () => spy() }],
        trigger: 'onChange',
      })
      await ac.execute()
      expect(spy).to.be.calledOnce
    })

    it('should call the "execute" method on every action', async () => {
      const spy1 = sinon.spy()
      const spy2 = sinon.spy()
      const ac = getActionChain({
        actions: [
          { action: getBuiltInAction(), fn: spy1 },
          { action: getEvalObjectAction(), fn: spy2 },
        ],
        trigger: 'onChange',
      })
      await ac.execute()
      expect(spy1).to.be.calledOnce
      expect(spy2).to.be.calledOnce
    })

    it(`should set the current action instance as the value of the "current" property`, async () => {
      const ac = getActionChain({
        actions: [getBuiltInAction(), getEvalObjectAction()],
        trigger: 'onChange',
      })
      expect(ac.current).to.be.null
      let result = await ac.next()
      expect(isAction(ac.current)).to.be.true
      expect(ac.current).to.have.property('actionType', 'builtIn')
      expect(ac.current).to.eq(result.value)
      result = await ac.next()
      expect(isAction(ac.current)).to.be.true
      expect(ac.current).to.have.property('actionType', 'evalObject')
      expect(ac.current).to.eq(result.value)
    })

    describe(`Injecting`, () => {
      it(`should return the action instance`, () => {
        const ac = getActionChain({
          actions: [getBuiltInAction()],
          trigger: 'onChange',
        })
        const action = ac.inject(new Action(ac.trigger, getPopUpAction()))
        expect(isAction(action)).to.be.true
      })

      it(`should add the new action in the beginning of the queue`, () => {
        const ac = getActionChain({
          actions: [getBuiltInAction(), getPopUpAction()],
          trigger: 'onChange',
        })
        expect(ac.queue).to.have.lengthOf(2)
        expect(ac.queue[0]).to.have.property('actionType', 'builtIn')
        ac.inject(new Action(ac.trigger, getPopUpAction()))
        expect(ac.queue).to.have.lengthOf(3)
        expect(ac.queue[0]).to.have.property('actionType', 'popUp')
      })

      it(`should add the new action inside its "injected" object in the snapshot`, () => {
        const ac = getActionChain({
          actions: [getBuiltInAction(), getEvalObjectAction()],
          trigger: 'onChange',
        })
        const injectee = getPopUpAction()
        ac.inject(injectee)
        expect(ac.snapshot().injected[0])
          .to.have.property('original')
          .eq(injectee)
      })

      describe(`When the action injecting is a popUp using "${chalk.magenta(
        'wait',
      )}"`, () => {
        it(`should set its status to "aborting"`, () => {
          const ac = getActionChain({
            actions: [getBuiltInAction(), getEvalObjectAction()],
            loader: (actions) => actions.map((action) => createAction(action)),
          })
          // expect(ac.).to.have.property('status', 'aborting')
        })

        xit(`should still execute the injectee`, () => {
          getBuiltInAction(), getEvalObjectAction()
          const ac = getActionChain({
            actions: [getUpdateObjectAction(), getSaveObjectAction()],
            trigger: 'onChange',
          })
          const injectee = getPopUpAction()
        })

        xit(`should call abort on the remaining actions in the queue`, () => {
          //
        })

        xit(`should not be calling executors when aborting`, () => {
          //
        })

        xit(`should set its status to "aborted" after its done`, () => {
          //
        })
      })
    })
  })

  describe(italic(`Aborting`), () => {
    it(`should return true if status is "aborted"`, () => {
      const ac = getActionChain({
        actions: [getBuiltInAction(), getEvalObjectAction()],
        trigger: 'onMouseLeave',
      })
      expect(ac.snapshot().status).to.eq(IDLE)
      ac.abort()
      expect(ac.snapshot().status).to.eq(ABORTED)
      expect(ac.isAborted()).to.be.true
    })

    it(`should not throw an error`, async () => {
      const ac = getActionChain({
        actions: [getEvalObjectAction()],
        trigger: 'placeholder',
      })
      expect(() => ac.abort()).to.not.throw()
    })

    it(`should append the AbortExecuteError error object to each aborted result in the array`, async () => {
      const ac = getActionChain({
        actions: [getEvalObjectAction(), getBuiltInAction()],
        trigger: 'onChange',
      })
      await ac.abort()
      const results = ac.snapshot().results
      expect(results).to.have.lengthOf(2)
      ac.queue.forEach((_, index) => {
        expect(results[index].result).to.be.instanceOf(AbortExecuteError)
      })
    })
  })

  describe(italic(`Observers`), () => {
    describe(magenta(`onAbortStart`), () => {
      it(`should call ${magenta(`onAbortStart`)} when aborting`, async () => {
        const spy = sinon.spy()
        const ac = getActionChain({
          actions: [getEvalObjectAction(), getBuiltInAction()],
          trigger: 'onChange',
          use: { onAbortStart: spy },
        })
        await ac.abort()
        expect(spy).to.be.calledOnce
      })
    })

    describe(magenta(`onAbortEnd`), () => {
      it(`should call ${magenta(
        `onAbortEnd`,
      )} in the end of aborting`, async () => {
        const spy = sinon.spy()
        const ac = getActionChain({
          actions: [getEvalObjectAction(), getBuiltInAction()],
          trigger: 'onChange',
          use: { onAbortStart: spy },
        })
        await ac.abort()
        ac.snapshot().results.forEach((r) => {
          expect(r.result).to.be.instanceOf(AbortExecuteError)
          expect(r.action.executed).to.be.false
          expect(r.action.aborted).to.be.true
        })
      })
    })

    describe(magenta(`onAbortError`), () => {
      xit(`should be called when an error occurred during the abort`, () => {
        //
      })
    })

    describe(magenta(`onBeforeAbortAction`), () => {
      xit(`should be called right before calling the action's abort method`, () => {
        const ac = getActionChain({
          actions: [getBuiltInAction(), getEvalObjectAction()],
          trigger: 'onMouseLeave',
        })
        ac.loader = (actions) => {
          return actions.map((a) =>
            createAction({ action: a, trigger: 'onClick' }),
          )
        }
        ac.loadQueue()
      })
    })

    describe(magenta(`onAfterAbortAction`), () => {
      xit(`should be called right after calling the action's abort method`, () => {
        //
      })
    })

    describe(magenta(`onExecuteStart`), () => {
      xit(`should called`, () => {
        //
      })
    })

    describe(magenta(`onExecuteEnd`), () => {
      //
    })

    describe(magenta(`onExecuteResult`), () => {
      //
    })

    describe(magenta(`onRefresh`), () => {
      //
    })

    describe(magenta(`onBeforeInject`), () => {
      //
    })

    describe(magenta(`onAfterInject`), () => {
      //
    })
  })

  describe(italic(`Return values`), () => {
    // it(`should reach the result as { action, result } in the first`, () => {
    // 	//
    // })

    it(`should receive an array of { action, result } when aborting`, async () => {
      const ac = getActionChain({
        actions: [getBuiltInAction(), getEvalObjectAction()],
        trigger: 'onChange',
      })
      await ac.next({})
      const results = await ac.abort('idk')
      expect(results).to.be.an('array')
      expect(results).to.have.lengthOf(ac.actions.length)
    })

    xit(`should receive an array of { action, result } when execution is finished`, async () => {
      const ac = getActionChain({
        actions: [getBuiltInAction(), getEvalObjectAction()],
        trigger: 'onChange',
      })
      const results = await ac.execute()
      results.forEach((res) => {
        // expect(res).to.have.property('action').to.be.instanceOf(Action)
        // expect(res).to.have.property('result')
      })
    })
  })

  describe(italic(`snapshot`), () => {
    it(`should convert the data to an array`, async () => {
      const ac = getActionChain({
        actions: [getEvalObjectAction()],
        trigger: 'onChange',
      })
      const buff = new ArrayBuffer(3)
      ac.data.set('abc', buff)
      const snapshot = ac.snapshot()
      expect(snapshot.data).to.be.an('array')
      expect(snapshot.data).to.have.lengthOf(1)
      expect(snapshot.data[0]).to.eq(buff)
    })
  })

  xdescribe(italic(`Timing out`), () => {
    describe.skip(`when action chains don't respond or don't finish`, () => {
      xit(`should call the timeout setTimeout callback`, async function () {
        const ac = getActionChain({
          actions: [getEvalObjectAction(), getPopUpAction()],
          trigger: 'onBlur',
        })
        await ac.execute()
        // expect(ac.state.status).to.eq('aborted')
      })

      xit(`should save the ref on the instance`, () => {
        //
      })

      xit(`should execute after the provided milliseconds`, () => {
        //
      })

      xit(`should call "abort" on all remainining actions in the queue`, () => {
        //
      })

      xit(`should call its own "abort" method after aborting the remaining actions`, () => {
        //
      })

      xit(`should throw with the ${'AbortExecuteError'} error`, () => {
        //
      })

      xit(`should set the status to "aborted" and set the reason as timed out`, () => {
        //
      })
    })
  })
})

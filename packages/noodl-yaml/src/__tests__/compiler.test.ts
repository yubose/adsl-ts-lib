import { expect } from 'chai'
import chalk from 'chalk'
import sinon from 'sinon'
import y from 'yaml'
import { consts, is as coreIs } from 'noodl-core'
import Root from '../DocRoot'
import { createAssert } from '../assert'
import createNode from '../utils/createNode'
import is from '../utils/is'
import deref from '../utils/deref'
import DocDiagnostics from '../DocDiagnostics'
import DocVisitor, {
  clearState as clearVisitorState,
  getState as getVisitorState,
} from '../DocVisitor'
import * as com from '../compiler'
import * as c from '../constants'
import * as t from '../types'

const { Basic, Organic } = com

let docDiagnostics: DocDiagnostics
let docRoot: Root
let docVisitor: DocVisitor

let composer: y.Composer
let lexer: y.Lexer
let parser: y.Parser

beforeEach(() => {
  docRoot = new Root()
  docVisitor = new DocVisitor()
  docDiagnostics = new DocDiagnostics()
  docDiagnostics.use(docVisitor)
  docDiagnostics.use(docRoot)
  composer = new y.Composer({ prettyErrors: true, keepSourceTokens: true })
  lexer = new y.Lexer()
  parser = new y.Parser()
})

describe(`processors`, () => {
  describe(`createInstructions`, () => {
    it(`should set type to Inherit for dot`, () => {
      const ref = '.A.'
      const instructions = com.createInstructions(ref)
      expect(instructions[0]).to.have.property('type', Basic.Inherit)
      expect(instructions[2]).to.have.property('type', Basic.Inherit)
    })

    it(`should set type to Evaluate for =`, () => {
      const ref = '=.A@'
      const instructions = com.createInstructions(ref)
      expect(instructions[0]).to.have.property('type', Basic.Evaluate)
    })

    it(`should set type to Left for _.`, () => {
      const ref = '__.A@'
      const instructions = com.createInstructions(ref)
      expect(instructions[0]).to.have.property('type', Basic.Left)
      expect(instructions[1]).to.have.property('type', Basic.Left)
    })

    it(`should set type to Right for non-operations`, () => {
      const ref = '__.A@'
      const instructions = com.createInstructions(ref)
      expect(instructions[3]).to.have.property('type', Basic.Right)
    })

    it(`should set type to Override for @`, () => {
      const ref = '.A@'
      const instructions = com.createInstructions(ref)
      expect(instructions[2]).to.have.property('type', Basic.Override)
    })

    it(`should create instructions for reference strings`, () => {
      const ref = '.A.formData.currentIcon'
      const instructions = com.createInstructions(ref)
      expect(instructions).to.have.lengthOf(ref.length)
      instructions.forEach((instr, i) => expect(instr.value).to.eq(ref[i]))
      expect(instructions[0].type).to.eq(Basic.Inherit)
      expect(instructions[1].type).to.eq(Basic.Right)
      expect(instructions[2].type).to.eq(Basic.Inherit)
      expect(instructions[3].type).to.eq(Basic.Right)
      expect(instructions[4].type).to.eq(Basic.Right)
      expect(instructions[5].type).to.eq(Basic.Right)
      expect(instructions[6].type).to.eq(Basic.Right)
      expect(instructions[7].type).to.eq(Basic.Right)
      expect(instructions[8].type).to.eq(Basic.Right)
      expect(instructions[9].type).to.eq(Basic.Right)
      expect(instructions[10].type).to.eq(Basic.Right)
      expect(instructions[11].type).to.eq(Basic.Inherit)
      expect(instructions[12].type).to.eq(Basic.Right)
      expect(instructions[13].type).to.eq(Basic.Right)
      expect(instructions[14].type).to.eq(Basic.Right)
      expect(instructions[15].type).to.eq(Basic.Right)
      expect(instructions[16].type).to.eq(Basic.Right)
      expect(instructions[17].type).to.eq(Basic.Right)
      expect(instructions[18].type).to.eq(Basic.Right)
      expect(instructions[19].type).to.eq(Basic.Right)
      expect(instructions[20].type).to.eq(Basic.Right)
      expect(instructions[21].type).to.eq(Basic.Right)
      expect(instructions[21].value).to.eq('o')
      expect(instructions[22].type).to.eq(Basic.Right)
      expect(instructions[22].value).to.eq('n')
    })
  })

  describe.skip(`if`, () => {
    it(`should wrap if conditions`, () => {
      // process.stdout.write('\x1Bc')
      docRoot.clear()
      docRoot.set('A', { component: { type: 'label', text: 'Hello' } })
      docRoot.set('B', {
        component: { type: 'button', text: 'Submit' },
        components: [{ if: ['..profile', '..profile', 'A.component'] }],
      })
      const spy = sinon.spy()
      const wrapIf = (enter: t.AssertFn) => {
        return function _if(
          args: t.AssertFnArgs & { ifNode?: any; ifIndex?: any; state?: any },
        ) {
          if (args.state) {
            if (args.state === 'if') {
              const { node, ifIndex } = args
              const ifNode = node?.get?.('if') as any
              const ifItem = ifNode?.get?.(ifIndex)
              console.log(`[if] node`, ifNode)
              console.log(`[if] index: ${ifIndex}`)
              console.log(`[if] item`, ifItem)
              const ifItemKind = com.getIfNodeItemKind(ifIndex)
              console.log(`[if] ifItemKind`, ifItemKind)

              if (ifItemKind === c.IfItemKind.Condition) {
                //
              } else if (ifItemKind === c.IfItemKind.Truthy) {
                //
              } else if (ifItemKind === c.IfItemKind.Falsey) {
                //
              }
            }
          } else if (is.if(args.node as any)) {
            const result = enter(args)
            const isHandled = !coreIs.und(result)
            console.log(chalk.keyword('aquamarine')('result:'), result)
            if (!isHandled) {
              return _if({ ...args, state: 'if', ifIndex: 0 })
            } else {
              console.log(chalk.keyword('orange')('consumer handled'), result)
            }
          } else {
            return enter(args)
          }
        }
      }
      docDiagnostics.run({
        enter: wrapIf((args) => {
          const { add, node } = args
          if (node && is.if(node)) {
            console.log(chalk.keyword('navajowhite')(`[consumer] handling`))
            return 'handled'
          }
        }),
      })
    })
  })
})

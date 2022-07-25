const y = require('yaml')
const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const yml = fs.readFileSync(path.join(__dirname, '../codes.yml'), 'utf8')
const file = y.parse(yml)

console.log(file)

const varKeys = file.var

/**
 * @type { Map<number, { name: string; message: string; }> }
 */
const diagnosticCodes = Object.entries(file.codes).reduce(
  (map, [code, { name, message }]) => {
    map.set(Number(code), { name, message })
    return map
  },
  new Map(),
)

const program = ts.createProgram({
  options: {},
  rootNames: [],
})

/**
 * @param { typeof diagnosticCodes } mapping
 * @returns { string }
 */
function createGeneratorFunction(mapping) {
  const codes = [...mapping.entries()].map(([code, obj]) => ({
    code,
    ...obj,
  }))
  let src = ''
  src += `import { DiagnosticCode } from '../constants'`
  src += '\n'
  src += `function generateDiagnosticMessage(code: DiagnosticCode, arg?: any) {`
  src += '\n  switch (code) {'
  codes.forEach(({ code, name, message }) => {
    src += `\n    case DiagnosticCode.${name}:`
    src += `\n      return \`${message}\``
  })
  src += `\n  }`
  src += `\n}`
  return src
}

const srcFile = ts.createSourceFile(
  'generateDiagnosticMessage.ts',
  createGeneratorFunction(diagnosticCodes),
  ts.ScriptTarget.ES2015,
  ts.ScriptKind.TS,
)

// srcFile.

process.stdout.write('\x1Bc')

// fs.writeFileSync(
//   path.join(process.cwd(), 'codes.json'),
//   JSON.stringify(
//     [...diagnosticCodes.entries()].map(([code, obj]) => ({ code, ...obj })),
//     null,
//     2,
//   ),
//   'utf8',
// )

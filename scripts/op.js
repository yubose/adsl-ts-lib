#!/usr/bin/env node
console.clear()
const u = require('@jsmanifest/utils')
const { aquamarine, cyan, magenta, red, white } = require('noodl-common')
const meow = require('meow')
const yaml = require('yaml')
const fs = require('fs-extra')
const pkgJson = require('../package.json')

/** @type { Record<string, any> } */
// const config = yaml.parse(fs.readFileSync('noodl.yml', 'utf8'))
const tag = (s) => cyan(`[${s}]`)
const pkgs = {
  nui: 'noodl-ui',
  ndom: 'noodl-ui-dom',
  ntest: 'noodl-ui-test-utils',
  ntil: 'noodl-utils',
}

const cli = meow(
  `
  Usage

  $ op update --lib (or -l) ${magenta(`@aitmed/cadl`)}
  $ op start (or -s) --lib (or --app) --env test
  $ op build (or -b) --lib (or --app) --env stable
`,
  {
    flags: {
      abc: { type: 'boolean' },
      start: { alias: 's', type: 'string' },
      build: { alias: 'b', type: 'string' },
      convert: { alias: 'c', type: 'string' },
      test: { alias: 't', type: 'string' },
      update: { alias: 'u', type: 'string' },
      deploy: { alias: 'd', type: 'boolean' },
      message: { alias: 'm', type: 'string' },
      ntil: { type: 'string' },
      ntest: { type: 'string' },
    },
  },
)

const { flags, input } = cli
const script = input[0]

console.log(`\n${cyan('Args')}`, flags)
console.log(
  `${cyan('Input')}: ${white(input.join(', '))} (${aquamarine(
    u.isArr(input) ? 'array' : typeof input,
  )})\n`,
)

if (flags.start || flags.build || (flags.start === '' && !input.length)) {
  require('./buildOrStart')(getCliArgs())
} else if (flags.test) {
  require('./test')(getCliArgs())
} else if (flags.update || input[0] === 'update') {
  require('./update')(getCliArgs())
} else {
  switch (script) {
    case 'convert':
    case 'split':
    case 'sync':
    case 'update':
      require(`./${script}`)(getCliArgs())
      break
    default:
      throw new Error(
        `${red('Invalid script')}. Current available options are: ${cyan(
          `build`,
        )}, ${cyan(`start`)}, ${cyan(`convert`)}, ${cyan(`split`)}, ${cyan(
          `sync`,
        )}, ${cyan(`update`)}`,
      )
  }
}

function getCliArgs() {
  return {
    flags,
    input,
    pkgs,
    pkgJson,
    script: input[0],
    tag,
  }
}

module.exports = getCliArgs()

process.on('exit', (code) => {
  console.log(`Process exited with code ${code}`)
})

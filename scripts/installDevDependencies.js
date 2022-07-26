const chalk = require('chalk')
const os = require('os')
const { execSync } = require('child_process')
const pkg = require('../package.json')

const aqua = chalk.keyword('aquamarine')
const coolGold = chalk.keyword('navajowhite')

const packages = [
  '@babel/core',
  '@jsmanifest/typefest',
  '@jsmanifest/utils',
  '@rollup/plugin-babel',
  '@rollup/plugin-commonjs',
  '@rollup/plugin-node-resolve',
  '@types/babel__core',
  '@types/chai',
  '@types/fs-extra',
  '@types/jsdom-global',
  '@types/lodash',
  '@types/mocha',
  '@types/sinon-chai',
  'chai',
  'concurrently',
  'cross-env',
  'esbuild',
  'fs-extra',
  'jsdom',
  'jsdom-global',
  'lerna',
  'lodash',
  'loglevel',
  'mocha',
  'noodl',
  'nx',
  'rollup',
  'rollup-plugin-esbuild',
  'rollup-plugin-filesize',
  'rollup-plugin-peer-deps-external',
  'rollup-plugin-progress',
  'sinon-chai',
  'ts-mocha',
  'type-fest',
  'typescript',
  'winston',
  'yaml',
]

let cmd = ''

if (os.platform() === 'win32') {
  cmd += `npm install -D ${packages.join(' ')}`
} else {
  cmd += `bun add -d ${packages.join(' ')}`
}

execSync(cmd, {
  shell: true,
  stdio: 'inherit',
})

Object.keys(pkg.devDependencies).forEach((package) => {
  if (!packages.includes(package)) {
    console.error(
      `${coolGold(
        package,
      )} was not included in the list of packages to install`,
    )
  }
})

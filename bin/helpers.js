const u = require('@jsmanifest/utils')
const childProcess = require('child_process')
const chalk = require('chalk')
const esbuild = require('esbuild')
const del = require('del')
const fs = require('fs-extra')
const fg = require('fast-glob')
const os = require('os')
const path = require('path')
const y = require('yaml')
const winston = require('winston')

const log = winston.createLogger({
  format: winston.format.combine(
    winston.format.simple(),
    winston.format.colorize({ level: 'debug' }),
  ),
  transports: [new winston.transports.Console()],
})

/**
 * @param { string } cmd
 * @param { import('child_process').ExecSyncOptions } options
 */
const execSync = (cmd = '', options) =>
  childProcess.execSync(cmd, { shell: true, stdio: 'inherit', ...options })

const helpers = {
  color: {
    aqua: chalk.keyword('aquamarine'),
    coolGold: chalk.keyword('navajowhite'),
    purple: chalk.hex('#D583FB'),
    yellow: chalk.hex('#FFDB72'),
  },
  cwd: process.cwd(),
  del,
  esbuild,
  execSync,
  env: process.env,
  fg,
  fs,
  log,
  path,
  platform: os.platform(),
  u,
  y,
}

function getHelpers() {
  return helpers
}

module.exports = getHelpers

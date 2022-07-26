const u = require('@jsmanifest/utils')
const { spawnSync } = require('child_process')

/**
 * @param { string } cmd
 * @returns { import('child_process').SpawnSyncReturns }
 */
const exec = (cmd, o) => spawnSync(cmd, { shell: true, stdio: 'inherit', ...o })

;(async function () {
  try {
    u.newline()
    exec('npm run bootstrap -- --ignore-scripts')
    exec(`lerna run --scope noodl-types build`)
    exec(`lerna run build --ignore noodl-types --ignore noodl-loader`)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
  }
})()

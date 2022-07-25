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

    for (const libs of [
      ['noodl-types'],
      ['noodl-action-chain', 'noodl-utils', 'noodl-builder'],
      ['noodl-ui-test-utils', 'noodl-core', 'noodl-yaml'],
      ['noodl-ui'],
    ]) {
      console.log(`${u.cyan('Building')}: ${u.magenta(libs.join(', '))}`)
      let cmd = `lerna exec `
      libs.forEach((lib) => (cmd += `--scope ${lib} `))
      exec(cmd + `\"npm run build\"`)
    }

    const restLibs = ['gatsby-plugin-noodl', 'homepage', 'noodl-pi']
    let cmd = `lerna exec `
    console.log(`${u.cyan('Installing')}: ${u.magenta(restLibs.join(', '))}`)
    restLibs.forEach((lib) => (cmd += `--scope ${lib} `))
    exec(cmd + `\"npm install -f\"`)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.log(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
  }
})()

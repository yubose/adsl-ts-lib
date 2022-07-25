const execa = require('execa')
const u = require('@jsmanifest/utils')
const { magenta, newline, red } = require('noodl-common')

const pkgs = {
  lvl2: '@aitmed/ecos-lvl2-sdk',
  sdk: '@aitmed/cadl',
  noodlUtils: 'noodl-utils',
  noodlTypes: 'noodl-types',
  noodlActionChain: 'noodl-action-chain',
  ntest: 'noodl-ui-test-utils',
}

/**
 *
 * @param { import('./op') } props
 */
async function update(props) {
  const path = require('path')
  const { readdir } = require('fs-extra')

  let { config, flags, input, pkgJson, tag } = props
  let { lib, deploy, message } = flags

  const localLibs = await readdir(
    path.resolve(path.join(process.cwd(), 'packages')),
  )

  const remotePkgs = []
  const localPkgs = []

  let npmInstallStr = `npm i`
  let addFilesStr = `git add `

  if (flags.update) {
    const value = flags.update

    // @aitmed/cadl + @aitmed/ecos-lvl2-sdk
    if (value === 'sdk') {
      !message && (message = `Updated sdk`)
      const cmd =
        `npm i ${pkgs.lvl2}@latest ${pkgs.sdk}@latest ` +
        `&& git add package.json package-lock.json ` +
        `&& git commit -m "${message}" ` +
        `&& git push ` +
        `&& npm run build:deploy:test`
      execa.commandSync(cmd, { shell: true, stdio: 'inherit' })
    } else if (value === 'noodl') {
      !message && (message = `Updated NOODL libs`)
      const cmd =
        `npm i ` +
        `${pkgs.lvl2}@latest ` +
        `${pkgs.sdk}@latest ` +
        `${pkgs.noodlActionChain}@latest ` +
        `${pkgs.noodlTypes}@latest ` +
        `${pkgs.noodlUtils}@latest ` +
        `&& git add package.json package-lock.json ` +
        `&& git commit -m "${message}" ` +
        `&& git push `
      execa.commandSync(cmd, { shell: true, stdio: 'inherit' })
    }
    // noodl-types
    else if (value === 'nt') {
      !message && (message = `Updated ${pkgs.noodlTypes}`)
      execa.commandSync(`npm i ${pkgs.noodlTypes}@latest `, {
        shell: true,
        stdio: 'inherit',
      })
      u.log(u.green(`Updated ${pkgs.noodlTypes}`))
    }
    // noodl-utils
    else if (value === 'ntil') {
      !message && (message = `Updated ${pkgs.noodlUtils}`)
      execa.commandSync(`npm i ${pkgs.noodlUtils}@latest `, {
        shell: true,
        stdio: 'inherit',
      })
      u.log(u.green(`Updated ${pkgs.noodlUtils}`))
    }
    // noodl-action-chain
    else if (value === 'nac') {
      !message && (message = `Updated ${pkgs.noodlActionChain}`)
      execa.commandSync(`npm i ${pkgs.noodlActionChain}@latest `, {
        shell: true,
        stdio: 'inherit',
      })
      u.log(u.green(`Updated ${pkgs.noodlActionChain}`))
    }
  }
  // noodl-ui-test-utils
  else if (value === 'ntest') {
    !message && (message = `Updated ${pkgs.ntest}`)
    execa.commandSync(`npm i ${pkgs.ntest}@latest `, {
      shell: true,
      stdio: 'inherit',
    })
    u.log(u.green(`Updated ${pkgs.ntest}`))
  } else {
    if (input[1] === 'sdk') {
      npmInstallStr = `${npmInstallStr} -D`
      remotePkgs.push('@aitmed/cadl@latest', '@aitmed/ecos-lvl2-sdk@latest')
    } else if (input[1] === 'noodl') {
      npmInstallStr = `${npmInstallStr}`
      remotePkgs.push('noodl-action-chain', 'noodl-types', 'noodl-utils')
    } else {
      addFilesStr = `lerna exec ${addFilesStr}`
      // Local packages
      const localPackages = input[1]?.slice().filter(Boolean)
      if (localPackages?.length) {
        for (const pkg of localPackages) {
          if (localLibs.includes(pkg)) {
            localPkgs.push(pkg)
          } else {
            // TODO - What should we do here?
          }
        }
      }
    }

    if (remotePkgs.length) {
      addFilesStr += `package.json package-lock.json`
    } else if (localPkgs.length) {
      for (const pkg of localPkgs) {
        if (localLibs.some((localLib) => localLib.endsWith(pkg))) {
          addFilesStr += ` packages/${pkg} `
        } else {
          newline()
          throw new Error(
            red(
              `The ${magenta(`local`)} package "${magenta(
                pkg,
              )} that was provided is not in the ${magenta(
                `/packages`,
              )} directory"\n`,
            ),
          )
        }
      }
    } else {
      newline()
      throw new Error(
        red(
          `There are no local/remote packages to update for input "${input}"\n`,
        ),
      )
    }
  }
}

module.exports = update

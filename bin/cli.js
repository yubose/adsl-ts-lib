#!/usr/bin/env node
const { Command } = require('commander')
const getHelpers = require('./helpers')

const program = new Command()
const helpers = getHelpers()

const { cwd, execSync, fs, path, u } = helpers

function getPackage(value) {
  let pkg = ''
  if (u.isStr(value)) {
    if (/loader/i.test(value)) {
      pkg = `noodl-loader`
    } else if (/types/i.test(value)) {
      pkg = `noodl-types`
    } else if (/utils/i.test(value)) {
      pkg = `noodl-utils`
    } else if (/ui/i.test(value)) {
      pkg = `noodl-ui`
    }
  } else {
    //
  }
  if (!pkg) {
    throw new Error(
      `Could not return a valid package using value "${u.yellow(value)}"`,
    )
  }
  return pkg
}

program.command('build <package>').action((package, options, cmd) => {
  console.log({ package, options })
  execSync(`lerna exec --scope ${getPackage(package)} \"bun run build\"`)
})

program.command('start <package>').action((package, options, cmd) => {
  console.log({ package, options })
  execSync(`lerna exec --scope ${getPackage(package)} \"bun run start\"`)
})

program.command('docs <package>').action(async (package, options) => {
  console.log({ package, options })

  const basedir = path.resolve(path.join(cwd, 'packages/noodl-types'))
  const entryPoint = path.join(basedir, 'src', 'index.ts')
  const tsconfig = path.join(basedir, 'tsconfig.json')

  await require('../scripts/tsdocs')({
    entryPoint,
    name: getPackage(package),
    tsconfig,
  })
})

function getHelp() {
  const $ = `${u.magenta('$')}`
  const tag = `${u.cyan('nui')}`
  const prefix = `${$} ${tag}`
  const cmd = (s, or) =>
    `${u.yellow(`--${s}`)}${or ? ` (${u.yellow(`-${or}`)})` : ''}`
  const val = (s) => `${u.white(s)}`
  const lines = []
  lines.push(
    `${prefix} ${cmd('start')} ${val('homepage')} ${cmd('config', 'c')} ` +
      `${val('www')} ${cmd('clean')}`,
  )
  lines.push(`${prefix} ${cmd('server', 'admind3')} ${cmd('g')} ${val('app')}`)
  return lines.join('\n')
}

// const cli = meow(getHelp(), {
//   autoHelp: true,
//   flags: {
//     config: { alias: 'c', type: 'string' },
//     clean: { type: 'boolean' },
//     deploy: { type: 'string' },
//     dev: { type: 'string' },
//     start: { type: 'string' },
//     build: { type: 'string' },
//     bundle: { type: 'string' },
//     publish: { alias: 'p', type: 'string' },
//     test: { type: 'string' },
//     server: { type: 'string' },
//     generate: { alias: 'g', type: 'boolean' },
//   },
// })

//
// ;(async () => {
//   try {
//     const isStart = input[0] === 'start' || flags.start
//     const isBuild = flags.build && !isStart
//     const isTest = flags.test && !(isStart && isBuild)
//     const isPublish = flags.publish && !(isStart && isBuild && isTest)
//     const pkg =
//       input[0] === 'start'
//         ? input[1]
//         : flags.start ||
//           flags.build ||
//           flags.test ||
//           flags.deploy ||
//           flags.publish

//     let cmd = ''

//     if (flags.dev) {
//       const pkg = flags.dev
//       if (/core|yaml/i.test(pkg)) {
//         cmd = `lerna exec --scope noodl-${pkg} `
//         cmd += `\"npm run dev\"`
//       }
//       exec(cmd)
//     } else if (isStart || isBuild || isTest) {
//       // Static web app
//       if (/static|homepage/i.test(pkg)) {
//         let command = isBuild ? 'build' : isTest ? 'test:watch' : 'start'
//         cmd = `lerna exec --scope homepage \"`
//         if (!isTest) {
//           if (flags.config) cmd += `npx cross-env CONFIG=${flags.config} `
//           if (flags.clean) cmd += `gatsby clean && `
//         }
//         cmd += `npm run ${command}`
//         cmd += `\"`
//       }
//       // noodl-core documentation
//       else if (/docs/i.test(pkg)) {
//         let command = isBuild ? 'build' : 'start'
//         cmd = `lerna exec --scope noodl-core-docs \"`
//         cmd += `npm run ${command}`
//         cmd += `\"`
//       } else if (regex.libs.test(pkg)) {
//         let command = isBuild ? 'build' : isTest ? 'test' : 'start'
//         cmd = `lerna exec --scope `
//         cmd += `noodl-${pkg} `
//         cmd += `\"npm run ${command}\"`
//       } else {
//         throw new Error(
//           `"${pkg}" is not supported yet. Supported options: static, homepage, ${libs.join(
//             ', ',
//           )}`,
//         )
//       }
//       exec(cmd)
//     }
//     // Prep web app bundle for noodl-app (electron)
//     else if (flags.bundle) {
//       log.info(`Bundling ${bundle}`)

//       if (flags.bundle === 'webApp') {
//         const outputDir = path.join(process.cwd(), 'lib')
//         await require('../scripts/bundleWebApp')(scriptUtils, outputDir)
//         log.info(`Finished bundling!`)
//       } else {
//         throw new Error(`Invalid value for bundling. Choose one of: "webApp"`)
//       }
//     }
//     // Publish
//     else if (isPublish) {
//       if (regex.libs.test(pkg)) {
//         const folder = `noodl-${pkg}`
//         cmd = `cd packages/${folder} `
//         cmd += `&& npm run build`
//         cmd += `&& npm version patch -f && npm publish -f --access public`
//         cmd += `&& cd ../..`
//         exec(cmd)
//       } else {
//         throw new Error(
//           `Invalid value for publishing. Choose one of: ${libs.join(', ')}`,
//         )
//       }
//     }
//     // Start local server using noodl-cli
//     else if (flags.server) {
//       cmd = `noodl --server -c ${flagsnpm.server}`
//       if (flags.generate) cmd += ` -g app`
//     } else if (flags.deploy) {
//       if (/docs/i.test(pkg)) {
//         cmd = `cd packages/core-docs && git add . && git commit -m \"update\" && git push && cd ../..`
//       } else {
//         throw new Error(
//           `"${pkg}" is not supported yet for deploy script. Supported options: "docs"`,
//         )
//       }
//       exec(cmd)
//     }
//   } catch (error) {
//     const err = error instanceof Error ? error : new Error(String(error))
//     log.error(`[${u.yellow(err.name)}] ${u.yellow(err.message)}`)
//     throw err
//   }
// })()

program.parse(process.argv)

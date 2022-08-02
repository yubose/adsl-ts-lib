const {
  createExtractor,
  Loader,
  loadFile,
  loadFiles,
  Strategy,
  UrlStrategy,
} = require('noodl-loader')
const fg = require('fast-glob')
const fs = require('fs-extra')
const path = require('path')

//
;(async () => {
  try {
    const appFilePaths = await fg(
      'packages/noodl-loader/src/__tests__/fixtures/**/*',
    )

    const loader = new Loader()

    loader.use()

    await loader.load('packages/noodl-loader/src/__tests__/fixtures/meetd2.yml')

    console.log(loader)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
  }
})()

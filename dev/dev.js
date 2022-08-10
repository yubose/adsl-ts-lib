const u = require('@jsmanifest/utils')
const {
  createExtractor,
  Loader,
  loadFile,
  loadFiles,
  Strategy,
  FileStrategy,
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
    loader.config.configKey = 'patd2'

    await loader.load('patd2')

    console.log(loader.root)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
  }
})()

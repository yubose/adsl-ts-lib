process.stdout.write('\x1Bc')
const axios = require('axios').default
const u = require('@jsmanifest/utils')
const fs = require('fs-extra')
const path = require('path')
const { Loader } = require('../packages/noodl-loader')

const loader = new Loader()

loader.setConfigKey('patient')
;(async () => {
  try {
    loader.setFileLanguageSuffix('en')
    await loader.load()

    console.log(loader.root)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
    if ('data' in err) {
      const errResp = err.response
      console.dir(
        {
          name: err.name,
          message: err.message,
          respData: errResp?.data,
          respStatus: errResp?.status,
          respStatusText: errResp?.statusText,
          respStatusText: errResp?.statusText,
          respHeaders: errResp?.headers,
        },
        { depth: Infinity },
      )
    } else {
      console.error(`[${err.name}] ${err.message}`, err)
    }
  }
})()

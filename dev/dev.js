const u = require('@jsmanifest/utils')
const axios = require('axios').default
const { createExtractor, Loader, fetchYml, loadFile } = require('noodl-loader')
const fg = require('fast-glob')
const fs = require('fs-extra')
const path = require('path')

//
;(async () => {
  try {
    const loader = new Loader()
    loader.getState().languageSuffix = 'en'
    loader.config.configKey = 'testpage'
    await loader.load()
    console.log(loader)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    if (axios.isAxiosError(err)) {
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
          url: errResp.config.url,
        },
        { depth: Infinity },
      )
    } else {
      console.error(`[${err.name}] ${err.message}`, err)
    }
  }
})()

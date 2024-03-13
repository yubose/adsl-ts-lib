process.stdout.write('\x1Bc')
const axios = require('axios').default
const y = require('yaml')
const fs = require('fs-extra')
const path = require('path')
const _ = require('lodash')
const { Loader } = require('../packages/noodl-loader/dist')

async function start() {
  try {
    const loader = new Loader()

    loader.setConfigKey('patient')
    loader.setFileLanguageSuffix('en')

    await loader.load()

    const preloads = loader.cadlEndpoint.getPreload()
    const pages = loader.cadlEndpoint.getPages()

    const occurrences = {}

    for (const [key, value] of Object.entries(loader.root)) {
      if (y.isNode(value) || y.isDocument(value) || y.isPair(value)) {
        if (y.isDocument(value)) {
          if (y.isMap(value.contents)) {
            const keyCount = value.contents.items.length

            if (keyCount === 1) {
              const pageName = `${value.contents.items[0].key}`

              if (pages.includes(pageName)) {
                const pageValue = value.contents.get(pageName)

                if (y.isMap(pageValue)) {
                  const keys = pageValue.items.map((pair) => `${pair.key}`)

                  for (const key of keys) {
                    if (!(key in occurrences)) occurrences[key] = {}
                    const occ = occurrences[key]
                    if (!(pageName in occ)) {
                      occ[pageName] = { count: 0, type: null }
                    }

                    occ[pageName].count++

                    const valueNode = pageValue.get(key, true)

                    occ[pageName].type = y.isMap(valueNode)
                      ? 'object'
                      : y.isSeq(valueNode)
                      ? 'array'
                      : y.isScalar(valueNode)
                      ? typeof valueNode.value
                      : 'unknown'
                  }
                }
              }
            }
          }
        }
      } else {
        console.log(`Not a YAML node: ${key}`)
      }
    }

    const sortedOccurrences = _.orderBy(
      Object.entries(occurrences).map(([key, mapping]) => ({
        key,
        ...Object.entries(mapping).reduce(
          (acc, [pageName, { count }] = {}) => {
            acc.count += count
            // if (!acc.pages.includes(pageName)) acc.pages.push(pageName)
            return acc
          },
          { count: 0 },
          // { count: 0, pages: [] },
        ),
      })),
      (obj) => obj.count,
      'desc',
    )

    for (const result of sortedOccurrences) {
      console.log(result)
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    if (axios.isAxiosError?.(err)) {
      const errResp = err.response
      console.dir(
        {
          headers: err?.config?.headers,
          data: err?.config?.data,
          name: err.name,
          message: err.message,
          respData: errResp?.data,
          respStatus: errResp?.status,
          respStatusText: errResp?.statusText,
          respHeaders: errResp?.headers,
          url: err?.config?.url,
        },
        { depth: Infinity },
      )
    } else {
      console.error(`[${err.name}] ${err.message}`, err)
    }
  }
}

start()

/**
 * Tests are following this template:
 * https://www.gatsbyjs.com/docs/files-gatsby-looks-for-in-a-plugin/
 */

const { expect } = require('chai')
const pkgJson = require('../package.json')

const pluginName = 'gatsby-plugin-noodl'
const entryPoint = 'index.js'

describe(`setup`, () => {
  describe(`package.json`, () => {
    it(`should have a value in the "main" field`, () => {
      expect(pkgJson.main).not.to.be.empty
      expect(pkgJson.main).to.eq(entryPoint)
    })

    it(`should have a value in the "name" field`, () => {
      expect(pkgJson.name).not.to.be.empty
      expect(pkgJson.name).to.eq(pluginName)
    })

    /**
     * REMINDER: Put back the "version" field when releasing this plugin to the npm registry
     */
    xit(`should have a value in the "version" field`, () => {
      expect(pkgJson.version).not.to.be.empty
    })
  })
})

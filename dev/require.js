const fs = require('fs-extra')

function loadModule(filename, module, require) {
  const wrappedSrc = `(function (module, exports, require) {
			${fs.readFileSync(filename, 'utf8')}
		})(module, module.exports, require)`
  eval(wrappedSrc)
}

function require(moduleName) {
  console.log(`Require invoked for module: ${moduleName}`)

  const id = require.resolve(moduleName)

  if (require.cache[id]) {
    return require.cache[id].exports
  }

  // Module metadata
  const module = {
    exports: {},
    id,
  }

  // Update the cache
  require.cache[id] = module

  // Load the module
  loadModule(id, module, require)

  // Return exported variables
  return module.exports
}

require.cache = {}
require.resolve = (moduleName) => {
  /**
   * Resolve a full module id from the moduleName
   */
}

require('dev.js')

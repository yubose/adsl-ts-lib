const { Application, ProjectReflection, TSConfigReader } = require('typedoc')

/**
 * @param {{ entryPoint: string; name: string; tsconfig?: string  }} options
 * @param { import('../bin/types.js').Helpers } helpers
 */
module.exports = async function generateTypescriptDocs(options, helpers) {
  const { entryPoint, name, tsconfig } = options
  const { fs, path, u } = helpers

  if (!name) {
    throw new Error(
      `Cannot generate typescript docs for an empty or invalid package "${name}"`,
    )
  }

  try {
    const app = new Application()
    const tsConfigReader = new TSConfigReader()

    app.options.addReader(tsConfigReader)

    app.bootstrap({
      emit: 'docs',
      entryPoints: u.array(entryPoint),
      exclude: ['**/*.test.ts'],
      hideGenerator: true,
      logLevel: 'Verbose',
      name,
      showConfig: true,
      tsconfig,
    })

    app.convertAndWatch(callback)

    /**
     * @param { ProjectReflection } projectReflection
     */
    async function callback(projectReflection) {
      try {
        log('Received ProjectReflection')

        const { packageInfo, readme } = projectReflection

        console.log({
          numSourceFiles: projectReflection.files.length,
          ref2: projectReflection.files[1].reflections[0].signatures,
        })
      } catch (error) {
        if (error instanceof Error) throw error
        throw new Error(String(error))
      }
    }

    // const projectReflection = app.convert()
    // await app.generateDocs(projectReflection, './typedoc')
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    throw err
  }
}

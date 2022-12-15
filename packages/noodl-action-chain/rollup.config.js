import resolve from '@rollup/plugin-node-resolve'
import filesize from 'rollup-plugin-filesize'
import progress from 'rollup-plugin-progress'
import commonjs from '@rollup/plugin-commonjs'
import esbuild from 'rollup-plugin-esbuild'

const extensions = ['.js', '.ts']

/**
 * @type { import('rollup').RollupOptions[] }
 */
const configs = [
  {
    input: 'src/index.ts',
    output: [
      {
        dir: './dist',
        exports: 'named',
        format: 'cjs',
        name: 'nac',
        sourcemap: true,
      },
    ],
    context: 'window',
    plugins: [
      resolve({
        browser: true,
        extensions,
        preferBuiltins: true,
      }),
      commonjs(),
      filesize(),
      progress(),
      esbuild({
        include: /\.ts$/,
        exclude: /node_modules/,
        minify: true,
        minifyIdentifiers: false,
        target: 'es2018',
      }),
    ],
  },
]

export default configs

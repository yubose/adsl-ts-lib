import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import filesize from 'rollup-plugin-filesize'
import progress from 'rollup-plugin-progress'
import esbuild from 'rollup-plugin-esbuild'

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
        format: 'umd',
        name: 'noodlYaml',
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      filesize(),
      progress(),
      esbuild({
        include: /\.ts$/,
        exclude: /node_modules/,
        target: 'es2018',
      }),
    ],
  },
]

export default configs

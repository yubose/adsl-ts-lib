import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
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
        dir: `dist`,
        format: 'umd',
        globals: {
          'noodl-action-chain': 'nac',
          'noodl-types': 'ntypes',
          'noodl-utils': 'nutils',
          signature_pad: 'spad',
        },
        name: 'nutils',
        sourcemap: true,
      },
    ],
    plugins: [
      nodeResolve({
        extensions: ['.js'],
        moduleDirectories: ['node_modules'],
      }),
      commonjs(),
      filesize(),
      progress(),
      esbuild({
        include: /\.ts?$/,
        exclude: /node_modules/,
        minify: false,
        target: 'es2015',
        sourceMap: true,
      }),
    ],
  },
]

export default configs

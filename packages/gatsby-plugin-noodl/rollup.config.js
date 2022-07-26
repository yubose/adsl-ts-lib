import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import filesize from 'rollup-plugin-filesize'
import progress from 'rollup-plugin-progress'
import esbuild from 'rollup-plugin-esbuild'
import json from '@rollup/plugin-json'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import externals from 'rollup-plugin-peer-deps-external'

/** @type { import('rollup').Plugin[] } */
const plugins = [
  resolve(),
  commonjs(),
  // nodePolyfills(),
  externals(),
  json(),
  filesize(),
  progress(),
  esbuild({
    include: /\.ts$/,
    exclude: /node_modules/,
    target: 'es2018',
    // optimizeDeps: {
    //   sourceMap: true,
    //   include: [],
    //   exclude: ['canvas', 'jsdom-global', 'jsdom'],
    //   esbuildOptions: {
    //     bundle: true,
    //     format: 'cjs',
    //     // logLevel: 'debug',
    //     sourcemap: 'external',
    //     minify: true,
    //     minifyIdentifiers: false,
    //     platform: 'node',
    //     splitting: false,
    //     target: 'es2018',
    //     treeShaking: false,
    //   },
    // },
  }),
]

/**
 * @type { import('rollup').RollupOptions[] }
 */
const configs = [
  {
    input: './src/gatsby-node.ts',
    output: {
      dir: '.',
      format: 'cjs',
      inlineDynamicImports: false,
    },
    plugins,
  },
]

export default configs

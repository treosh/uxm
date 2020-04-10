// usage: yarn build:rollup

import { join } from 'path'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

export default {
  input: join(__dirname, '../src/index.js'),
  output: {
    file: join(__dirname, '../dist/uxm.bundle.js'),
    format: 'iife',
    name: 'uxm',
  },
  plugins: [resolve(), commonjs(), terser()],
}

import { join } from 'path'
import linaria from 'linaria/rollup'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import css from 'rollup-plugin-css-only'

export default {
  input: [join(__dirname, 'src/popup.js'), join(__dirname, 'src/background.js'), join(__dirname, 'src/content.js')],
  output: {
    dir: join(__dirname, 'build/assets'),
    format: 'es',
  },
  plugins: [
    resolve(),
    commonjs(),
    linaria({ cacheDirectory: join(__dirname, '../node_modules/.cache/linaria-cache') }),
    css({ output: join(__dirname, './build/assets/popup.css') }),
    terser(),
  ],
}

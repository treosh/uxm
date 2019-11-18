import { config } from './config'

export const perf = typeof performance !== 'undefined' ? performance : null
export const raf = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : setImmediate || setTimeout

/**
 * Round: https://stackoverflow.com/a/18358056
 * @param {number} val @param {number} [precision] @return {number}
 */
export function round(val, precision = 0) {
  // @ts-ignore
  return +(Math.round(`${val}e+${precision}`) + `e-${precision}`)
}

/** @param {string} str @param {any} args */
export function debug(str, ...args) {
  if (config.debug) console.log(`%cuxm: ${str}`, 'color: #3398DB', ...args)
}

/** @param {any} args */
export const warn = (...args) => console.warn(...args)

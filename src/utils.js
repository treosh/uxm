import { config } from './config'

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

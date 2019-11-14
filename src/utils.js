import roundTo from 'round-to'
import { config } from './config'

/** @param {number} val @param {number} [precision] @return {number} */
export function round(val, precision = 0) {
  return roundTo(val, precision)
}

/** @param {string} str @param {any} args */
export function debug(str, ...args) {
  if (config.debug) console.log(`%c${str}`, 'color: #3398DB', ...args)
}

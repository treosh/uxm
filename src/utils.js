import roundTo from 'round-to'

let options = {
  debug: false
}

/** @param {object} newOptions @return {object} */
export function setOptions(newOptions) {
  options = { ...options, ...newOptions }
  return options
}

/** @param {number} val @param {number} [precision] @return {number} */
export function round(val, precision = 0) {
  return roundTo(val, precision)
}

/** @param {string} str @param {any} args */
export function debug(str, ...args) {
  if (options.debug) console.log(`%c${str}`, 'color: #3398DB', ...args)
}

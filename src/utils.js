/** @param {number} val @param {number} [precision] @return {number} */
export function round(val, precision = 0) {
  // hack from: https://stackoverflow.com/a/18358056
  // @ts-ignore
  return +(Math.round(`${val}e+${precision}`) + `e-${precision}`)
}

/** @param {string} str @param {any} args */
export function debug(str, ...args) {
  if (debug.enable) console.log(`%cuxm: ${str}`, 'color: #3398DB', ...args)
}
debug.enable = false // disable debug by default

/** @param {any} args */
export const warn = (...args) => console.warn(...args)

/** @param {any} val @return {boolean} */
export const isUndefined = val => typeof val === 'undefined'

// constants
export const perf = isUndefined(performance) ? null : performance
export const raf = isUndefined(requestAnimationFrame) ? setTimeout : requestAnimationFrame

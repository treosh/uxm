/** @param {number} val @param {number} [precision] @return {number} */
export function round(val, precision = 0) {
  // hack from: https://stackoverflow.com/a/18358056
  // @ts-ignore
  return +(Math.round(`${val}e+${precision}`) + `e-${precision}`)
}

/** @param {object} obj */
export function isObject(obj) {
  return obj && Object.keys(obj).length !== 0 && obj.constructor === Object
}

// constants
export const perf = typeof performance === 'undefined' ? null : performance
export const raf = typeof requestAnimationFrame === 'undefined' ? setTimeout : requestAnimationFrame
export const nav = typeof navigator === 'undefined' ? null : navigator
export const loc = typeof location === 'undefined' ? null : location
export const doc = typeof document === 'undefined' ? null : document
export const PO = typeof PerformanceObserver === 'undefined' ? null : PerformanceObserver

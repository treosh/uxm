import roundTo from 'round-to'

/** @param {number} val @param {number} [precision] @return {number} */
export function round(val, precision = 0) {
  return roundTo(val, precision)
}

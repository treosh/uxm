/** @param {number} val @param {number} [precision] @return {number} */
export function round(val, precision = 0) {
  // hack from: https://stackoverflow.com/a/18358056
  // @ts-ignore
  return +(Math.round(`${val}e+${precision}`) + `e-${precision}`)
}

/** @param {any} obj */
export function isObject(obj) {
  return obj && Object.keys(obj).length !== 0 && obj.constructor === Object
}

/** @param {Element | null} el */
export function getSelector(el) {
  return el ? `${el.tagName.toLowerCase()}${el.className ? '.' : ''}${el.className.replace(/ /g, '.')}` : null
}

// constants
export const raf = typeof requestAnimationFrame === 'undefined' ? setTimeout : requestAnimationFrame
export const loc = typeof location === 'undefined' ? null : location
export const doc = typeof document === 'undefined' ? null : document
export const PO = typeof PerformanceObserver === 'undefined' ? null : PerformanceObserver

/** @typedef {{ effectiveType: 'slow-2g' | '2g' | '3g' | '4g', rtt: number, downlink: number }} NetworkInformation */
export const nav = /** @type {null | (Navigator & { deviceMemory: number, connection: NetworkInformation })} */ (typeof navigator ===
'undefined'
  ? null
  : navigator)

/**
 * @typedef {Object} Entry
 * user timing
 * @prop {string} entryType
 * @prop {() => any} toJSON
 * @prop {string} name
 * @prop {number} startTime
 * @prop {number} duration
 * @prop {object} [detail]
 * first-input
 * @prop {number} processingStart
 * @prop {number} processingEnd
 * largest-contentful-paint
 * @prop {HTMLElement} element
 * @prop {number} size
 * @prop {number} renderTime
 * @prop {number} loadTime
 * layout-shift
 * @prop {number} value
 * @prop {number} lastInputTime
 * @prop {boolean} hadRecentInput
 * resource
 * @prop {string} initiatorType
 * @prop {number} transferSize
 * @prop {number} encodedBodySize
 * @prop {number} decodedBodySize
 * navigation
 * @prop {string} type
 * @prop {number} domContentLoadedEventEnd
 * @prop {number} responseStart
 * @prop {number} loadEventEnd
 * element
 * @prop {string} identifier
 * @prop {DOMRectReadOnly} intersectionRect
 *
 * @typedef {{
 *    timing?: PerformanceTiming,
 *    now?(): number,
 *    clearMarks?(markName: string): void
 *    mark?(markName: string, markOptions?: object): Entry | undefined,
 *    measure?(measureName: string, startOrMeasureOptions?: string | object, endMark?: string): Entry | undefined
 *    getEntriesByType?(entryType: string): Entry[]
 *    getEntriesByName?(name: string): Entry[]
 * }} Perf
 */

export const perf = /** @type {null | Perf} */ (typeof performance === 'undefined' ? null : performance)

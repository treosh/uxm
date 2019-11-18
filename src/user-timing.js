import { perf, raf, round, warn } from './utils'

/** @typedef {{ entryType: "mark", name: string, startTime: number }} UserTimingMark */
/** @typedef {{ entryType: "measure", name: string, startTime: number, duration: number }} UserTimingMeasure */
/** @typedef {(measure: UserTimingMeasure | null) => any} UserTimingTimeEndPaintCallback */

/**
 * Create a custom performance mark with `markName` name.
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/mark
 *
 * @param {string} markName
 * @return {UserTimingMark | null}
 */

export function mark(markName) {
  if (!perf || !perf.mark) return null
  try {
    /** @type {PerformanceMark | void} */
    let m = perf.mark(markName)
    if (typeof m === 'undefined') {
      const entries = perf.getEntriesByName(markName)
      m = entries[entries.length - 1]
    }
    return { entryType: 'mark', name: m.name, startTime: round(m.startTime) }
  } catch (err) {
    warn(err)
    return null
  }
}

/**
 * Create performance measurement `measureName` between marks, the navigation start time, or `startMarkName`.
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure
 *
 * @param {string} measureName
 * @param {string} [startMarkName]
 * @param {string} [endMarkName]
 * @return {UserTimingMeasure | null}
 */

export function measure(measureName, startMarkName, endMarkName) {
  if (!perf || !perf.measure) return null
  try {
    /** @type {PerformanceMeasure | void} */
    let m = perf.measure(measureName, startMarkName, endMarkName)
    if (typeof m === 'undefined') {
      const entries = perf.getEntriesByName(measureName)
      m = entries[entries.length - 1]
    }
    return { entryType: 'measure', name: m.name, startTime: round(m.startTime), duration: round(m.duration) }
  } catch (err) {
    warn(err)
    return null
  }
}

/**
 * Start time measurement.
 * It's similar to console.time(label).
 *
 * @param {string} label
 * @return {UserTimingMark | null}
 */

export function time(label) {
  return mark(`start:${label}`)
}

/**
 * End time measurement.
 * It's similar to console.timeEnd(label).
 *
 * @param {string} label
 * @return {UserTimingMeasure | null}
 */

export function timeEnd(label) {
  return measure(label, `start:${label}`)
}

/**
 * End time measurement after the last paint.
 * It's similar to console.timeEnd(label) but async.
 *
 * @param {string} label
 * @param {UserTimingTimeEndPaintCallback} [cb]
 */

export function timeEndPaint(label, cb) {
  raf(() => {
    const m = timeEnd(label)
    if (typeof cb === 'function') cb(m)
  })
}

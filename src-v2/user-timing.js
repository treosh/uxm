import { perf, raf, round, warn } from './utils'
import { debug } from '.'

/** @typedef {{ entryType: string, name: string, startTime: number, detail?: ?object }} UserTimingMark */
/** @typedef {{ entryType: string, name: string, startTime: number, duration: number, detail?: ?object }} UserTimingMeasure */
/** @typedef {(measure: ?UserTimingMeasure) => any} UserTimingTimeEndPaintCallback */

/**
 * Create a custom performance mark with `markName` name.
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/mark
 *
 * @param {string} markName
 * @param {object} [markOptions]
 * @return {?UserTimingMark}
 */

export function mark(markName, markOptions) {
  if (!perf || !perf.mark) return null
  try {
    /** @type {UserTimingMark | void} */
    // @ts-ignore
    let m = perf.mark(markName, { detail: markOptions })
    if (typeof m === 'undefined') {
      const entries = perf.getEntriesByName(markName)
      m = /** @type {UserTimingMark} */ (entries[entries.length - 1])
    }
    if (isOptions(markOptions) && !m.detail) m.detail = markOptions
    return m ? { entryType: 'mark', name: m.name, startTime: round(m.startTime), detail: m.detail || null } : null
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
 * @param {string} [startOrMeasureOptions]
 * @param {string} [endMark]
 * @return {?UserTimingMeasure}
 */

export function measure(measureName, startOrMeasureOptions, endMark) {
  if (!perf || !perf.measure) return null
  try {
    /** @type {UserTimingMeasure | void} */
    let m = perf.measure(measureName, startOrMeasureOptions, endMark)
    if (typeof m === 'undefined') {
      const entries = perf.getEntriesByName(measureName)
      m = /** @type {UserTimingMeasure} */ entries[entries.length - 1]
    }
    if (isOptions(startOrMeasureOptions) && !m.detail) m.detail = startOrMeasureOptions
    return m
      ? {
          entryType: 'measure',
          name: m.name,
          startTime: round(m.startTime),
          duration: round(m.duration),
          detail: m.detail || null
        }
      : null
  } catch (err) {
    warn(err)
    return null
  }
}

/**
 * Get the time elapsed since the session start.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
 */

export function now() {
  return perf ? perf.now() : Date.now() - startTime
}
const startTime = Date.now()

/**
 * Start time measurement.
 * It's similar to console.time(label).
 *
 * @param {string} label
 * @return {?UserTimingMark}
 */

export function time(label) {
  if (!perf) return null
  const [m] = perf.getEntriesByName(getStartLabel(label))
  if (m) {
    warn('Timer "%s" already exists', label)
    perf.clearMarks(getStartLabel(label))
  }
  return mark(getStartLabel(label))
}

/**
 * End time measurement.
 * It's similar to console.timeEnd(label).
 *
 * @param {string} label
 * @return {?UserTimingMeasure}
 */

export function timeEnd(label) {
  if (!perf) return null
  perf.clearMarks(getStartLabel(label))
  const m = measure(label, `start:${label}`)
  if (!m) return null
  debug('%s: %sms', m.name, m.duration)
  return m
}

/**
 * End time measurement after the last paint.
 * It's similar to console.timeEnd(label) but async.
 *
 * @param {string} label
 * @param {UserTimingTimeEndPaintCallback} [callback]
 */

export function timeEndPaint(label, callback) {
  raf(() => {
    const m = timeEnd(label)
    if (callback) callback(m)
  })
}

/** @param {object} obj @return {boolean} */
const isOptions = obj => Object.keys(obj).length !== 0 && obj.constructor === Object

/** @param {string} label @return {string} */
const getStartLabel = label => `uxm:start:${label}`

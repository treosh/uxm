import { perf, raf, round, isObject } from './utils'

export let debugTime = true
const startTime = Date.now()
const timers = Object.create(null)
const getStartLabel = /** @param {string} label */ label => `uxm:start:${label}`

/**
 * Create a custom performance mark with `markName` name.
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/mark
 *
 * @param {string} markName
 * @param {object} [markOptions]
 */

export function mark(markName, markOptions) {
  if (!perf || !perf.mark || !perf.getEntriesByName) return null
  try {
    let m = perf.mark(markName, { detail: markOptions })
    if (typeof m === 'undefined') {
      const entries = perf.getEntriesByName(markName)
      m = entries[entries.length - 1]
    }
    if (isObject(markOptions) && m && !m.detail) m.detail = markOptions
    return m ? { entryType: 'mark', name: m.name, startTime: round(m.startTime), detail: m.detail || null } : null
  } catch (err) {
    console.warn(err)
    return null
  }
}

/**
 * Create performance measurement `measureName` between marks, the navigation start time, or `startMarkName`.
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure
 *
 * @param {string} measureName
 * @param {string | object} [startOrMeasureOptions]
 * @param {string} [endMark]
 */

export function measure(measureName, startOrMeasureOptions, endMark) {
  if (!perf || !perf.measure || !perf.getEntriesByName) return null
  try {
    let m = perf.measure(measureName, startOrMeasureOptions, endMark)
    if (typeof m === 'undefined') {
      const entries = perf.getEntriesByName(measureName)
      m = entries[entries.length - 1]
    }
    if (isObject(startOrMeasureOptions) && m && !m.detail) m.detail = startOrMeasureOptions
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
    console.warn(err)
    return null
  }
}

/**
 * Get the time elapsed since the session start.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
 */

export function now() {
  return perf ? round(perf.now()) : Date.now() - startTime
}

/**
 * Start time measurement.
 * It's similar to console.time(label).
 *
 * @param {string} label
 * @param {string} [startLabel]
 */

export function time(label, startLabel = getStartLabel(label)) {
  if (!perf) return null
  if (timers[label]) {
    console.warn('Timer "%s" already exists, ignore', label)
    return null
  }
  timers[label] = true
  return mark(startLabel)
}

/**
 * End time measurement.
 * It's similar to console.timeEnd(label).
 *
 * @param {string} label
 * @param {string} [startLabel]
 */

export function timeEnd(label, startLabel = getStartLabel(label)) {
  if (!perf) return null
  const m = measure(label, startLabel)
  if (perf.clearMarks) perf.clearMarks(startLabel)
  delete timers[startLabel]
  if (m && debugTime) console.log('%c%s: %sms', 'color: #3398DB', label, m.duration)
  return m || null
}

/**
 * End time measurement after the last paint.
 * It's similar to console.timeEnd(label) but async.
 *
 * @param {string} label
 * @param {string} [startLabel]
 */

export function timeEndPaint(label, startLabel) {
  raf(() => timeEnd(label, startLabel))
}

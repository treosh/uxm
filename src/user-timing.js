const perf = typeof window !== 'undefined' ? window.performance : null
const raf = typeof window !== 'undefined' ? window.requestAnimationFrame : setImmediate || setTimeout

/**
 * Create a custom performance mark with `markName` name.
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/mark
 *
 * @param {string} markName
 * @return {PerformanceMark | null}
 */

export function mark(markName) {
  if (!perf || !perf.mark) return null
  return perf.mark(markName)
}

/**
 * Create performance measurement `measureName` between marks, the navigation start time, or `startMarkName`.
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure
 *
 * @param {string} measureName
 * @param {string} [startMarkName]
 * @param {string} [endMarkName]
 * @return {PerformanceMeasure | null}
 */

export function measure(measureName, startMarkName, endMarkName) {
  if (!perf || !perf.measure) return null
  try {
    return perf.measure(measureName, startMarkName, endMarkName)
  } catch (err) {
    console.error(err)
    return null
  }
}

/**
 * Start time measurement.
 * It's similar to console.time(label).
 *
 * @param {string} label
 * @return {PerformanceMark | null}
 */

export function time(label) {
  return mark(`start:${label}`)
}

/**
 * End time measurement.
 * It's similar to console.timeEnd(label).
 *
 * @param {string} label
 * @return {PerformanceMeasure | null}
 */

export function timeEnd(label) {
  return measure(label, `start:${label}`)
}

/**
 * End time measurement after the last paint.
 * It's similar to console.timeEnd(label) but async.
 *
 * @param {string} label
 * @param {function} [cb]
 */

export function timeEndPaint(label, cb) {
  raf(() => {
    const m = timeEnd(label)
    if (typeof cb === 'function') cb(m)
  })
}

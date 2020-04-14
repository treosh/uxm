import { observeEntries } from '../performance-observer'
import { now } from '../user-timing'
import { onVisibilityChange } from '../utils/visibility-change'
import { round } from '../utils/index'

/** @typedef {{ metricType: 'cid', value: number, detail: { totalEntries: number, sessionDuration: number } }} CidMetric */

/** @param {(metric: CidMetric) => any} cb */
export function collectCid(cb, opts = {}) {
  /** @type {NodeJS.Timeout | null} */
  let timeout = null
  let cummulativeValue = 0
  let totalEntries = 0
  /** @type {PerformanceObserver | null} */
  let cidObserver = observeEntries('event', (inputDelays) => {
    const filteredInputDelays = filterInputDelays(inputDelays)
    const cid = filteredInputDelays.reduce((memo, inputDelay) => {
      memo += inputDelay.processingStart - inputDelay.startTime
      return memo
    }, 0)
    cummulativeValue += cid
    totalEntries += filteredInputDelays.length
    if (timeout) clearTimeout(timeout)
    if (opts.maxTimeout) timeout = setTimeout(emitCid, opts.maxTimeout)
  })
  onVisibilityChange(emitCid)

  function emitCid() {
    if (!cidObserver) return
    cidObserver.takeRecords()
    cidObserver.disconnect()
    cidObserver = null
    if (timeout) clearTimeout(timeout)
    if (totalEntries > 0) {
      cb({ metricType: 'cid', value: round(cummulativeValue, 2), detail: { totalEntries, sessionDuration: now() } })
    }
  }
}

export function filterInputDelays(es) {
  const inputDelays = []
  let groupInputDelays = []
  es.forEach((e, index) => {
    const nextEvent = es[index + 1]
    groupInputDelays.push(e)
    if (!nextEvent || e.duration !== nextEvent.duration) {
      groupInputDelays.sort((a, b) => {
        const aDelay = a.processingStart - a.startTime
        const bDelay = b.processingStart - b.startTime
        return aDelay - bDelay
      })
      const longestInputDelay = groupInputDelays[groupInputDelays.length - 1]
      inputDelays.push(longestInputDelay)
      groupInputDelays = []
    }
  })
  return inputDelays
}

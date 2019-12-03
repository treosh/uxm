import { observeEntries, getEntriesByType } from './performance-observer'
import { round, debug, onVisibilityChange, perf, raf } from './utils'
import { now } from './user-timing'

/** @typedef {'fcp' | 'lcp' | 'fid' | 'cls' | 'ttfb' | 'dcl' | 'load'} type */
/** @typedef {{ type: type, maxTimeout?: number, compute?: function }} MetricOpts */
/** @typedef {(metric: object) => any} MetricObserverCallback */

const FCP = 'fcp'
const FID = 'fid'
const LCP = 'lcp'
const CLS = 'cls'
const TTFB = 'ttfb'
const DCL = 'dcl'
const OL = 'load'

/**
 * Compute metric by type using buffered values.
 *
 * @param {type} type
 * @return {Promise<Object | null>}
 */

export function getMetricByType(type) {
  const metric = normalizetype(type)
  const entryType = getEntryTypeBytype(metric)
  return getEntriesByType(entryType).then(entries => {
    switch (metric) {
      case FCP:
        return computeFcp(entries)
      case FID:
        return computeFid(entries)
      case LCP:
        return computeLcp(entries)
      case CLS:
        return computeCls(entries)
      case TTFB:
        return computeTtfb(entries)
      case DCL:
        return computeDcl(entries)
      case OL:
        return computeLoad(entries)
    }
  })
}

/**
 * Observe `type`, if the value is already observed, return it.
 *
 * @param {MetricOpts | type} metricOpts
 * @param {MetricObserverCallback} callback
 */

export function collectMetrics(metricOpts, callback) {
  /** @type {MetricOpts} */
  const opts = typeof metricOpts === 'string' ? { type: metricOpts } : metricOpts
  const type = normalizetype(opts.type)
  const entryType = getEntryTypeBytype(type)
  switch (type) {
    case FCP:
      observeEntries({ type: entryType, buffered: true }, (paintEntries, fcpObserver) => {
        if (paintEntries.some(paintEntry => paintEntry.name === FCP)) {
          debug(FCP)
          fcpObserver.disconnect()
          callback((opts.compute || computeFcp)(paintEntries))
        }
      })
      break
    case FID:
      observeEntries({ type: entryType, buffered: true }, (fidEntries, fidObserver) => {
        if (fidEntries.length) {
          debug(FID)
          fidObserver.disconnect()
          callback((opts.compute || computeFid)(fidEntries))
        }
      })
      break

    case LCP:
      const maxTimeout = opts.maxTimeout || 5000
      /** @type {NodeJS.Timeout | null} */
      let timeout = null
      /** @type {Object | null} */
      let lcpMetric = null
      /** @type {PerformanceObserver | null} */
      let lcpObserver = observeEntries({ type: entryType, buffered: true }, lcpEntries => {
        lcpMetric = (opts.compute || computeLcp)(lcpEntries)
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(emitLcp, maxTimeout)
      })
      const emitLcp = () => {
        if (!lcpObserver) return
        debug(LCP)
        lcpObserver.takeRecords() // force pending values
        lcpObserver.disconnect()
        lcpObserver = null
        if (lcpMetric) callback(lcpMetric)
      }
      onVisibilityChange(emitLcp)
      break

    case CLS:
      /** @type {PerformanceEntry[]} */
      let allLsEntries = []
      /** @type {PerformanceObserver | null} */
      let clsObserver = observeEntries({ type: entryType, buffered: true }, lsEntries => {
        allLsEntries.push(...lsEntries)
      })
      const emitCls = () => {
        if (!clsObserver) return
        debug(CLS)
        clsObserver.takeRecords()
        clsObserver.disconnect()
        clsObserver = null
        if (allLsEntries.length) callback((opts.compute || computeCls)(allLsEntries))
      }
      onVisibilityChange(emitCls)
      break

    case TTFB:
    case DCL:
    case OL:
      const resolveNavigationTimingMetrics = () => {
        getEntriesByType(entryType).then(navEntries => {
          debug('navigation')
          const compute = opts.compute || (type === TTFB ? computeTtfb : type === DCL ? computeDcl : computeLoad)
          callback(compute(navEntries))
        })
      }
      if (document.readyState !== 'complete') {
        debug('listen for "load" event')
        addEventListener(
          'load',
          function onLoad() {
            removeEventListener('load', onLoad, true)
            raf(resolveNavigationTimingMetrics)
          },
          true
        )
      } else {
        resolveNavigationTimingMetrics()
      }
      break
  }
}

/**
 * Normalize `type` to strict names.
 *
 * @param {type} type
 * @return {type}
 */

function normalizetype(type) {
  const m = type.toLowerCase()
  if ([FCP, FID, LCP, CLS, TTFB, DCL, OL].indexOf(m) === -1) throw new Error(`Invalid metric: ${type}`)
  // @ts-ignore
  return m
}

/**
 * Normalize `type` to strict names.
 *
 * @param {type} type
 * @return {import('./performance-observer').EntryType}
 */

function getEntryTypeBytype(type) {
  return type === FCP
    ? 'paint'
    : type === FID
    ? 'first-input'
    : type === LCP
    ? 'largest-contentful-paint'
    : type === CLS
    ? 'layout-shift'
    : 'navigation'
}

/**
 * Compute FCP metric.
 * https://web.dev/fcp/#measure-fcp-in-javascript
 *
 * @param {PerformanceEntry[]} paintEntries
 * @return {{ type: "fcp", value: number } | null}}
 */

function computeFcp(paintEntries) {
  const paintEntry = paintEntries.length ? paintEntries.filter(e => e.name === 'first-contentful-paint')[0] : null
  return paintEntry ? { type: FCP, value: round(paintEntry.startTime) } : null
}

/**
 * Compute FID metric.
 * https://web.dev/fid/#measure-fid-in-javascript
 *
 * @param {PerformanceEntry[]} fidEntries
 * @return {{ type: "fid", value: number, startTime: number, name: string } | null}}
 */

function computeFid([fidEntry]) {
  return fidEntry
    ? {
        type: FID,
        value: round(fidEntry.processingStart - fidEntry.startTime),
        startTime: round(fidEntry.startTime),
        name: fidEntry.name
      }
    : null
}

/**
 * Compute LCP metric.
 * https://web.dev/lcp/#measure-lcp-in-javascript
 *
 * @param {PerformanceEntry[]} lcpEntries
 * @return {{ type: "lcp", value: number, size: number, elementSelector: string | null } | null}}
 */

function computeLcp(lcpEntries) {
  const lcpEntry = lcpEntries.length ? lcpEntries[lcpEntries.length - 1] : null
  return lcpEntry
    ? {
        type: LCP,
        value: round(lcpEntry.renderTime || lcpEntry.loadTime),
        size: lcpEntry.size,
        elementSelector: lcpEntry.element
          ? `${lcpEntry.element.tagName.toLowerCase()}.${lcpEntry.element.className.replace(/ /g, '.')}`
          : null
      }
    : null
}

/**
 * Compute CLS metric.
 * https://web.dev/cls/#measure-cls-in-javascript
 *
 * @param {PerformanceEntry[]} lsEntries
 * @return {{ type: "cls", value: number, totalEntries: number, sessionDuration: number }}}
 */

function computeCls(lsEntries) {
  const cls = lsEntries.reduce((memo, lsEntry) => {
    // Only count layout shifts without recent user input.
    // and collect percentage value
    if (!lsEntry.hadRecentInput) memo += 100 * lsEntry.value
    return memo
  }, 0)
  return { type: CLS, value: round(cls, 3), totalEntries: lsEntries.length, sessionDuration: round(now()) }
}

/**
 * Compute TTFB metric.
 * https://web.dev/custom-metrics/#navigation-timing-api
 *
 * @param {PerformanceEntry[]} navEntries
 * @return {{ type: "ttfb", value: number, serverTiming?: object[] } | null}}
 */

function computeTtfb([nav]) {
  if (nav) return { type: TTFB, value: round(nav.responseStart), serverTiming: nav.serverTiming || [] }
  if (perf && perf.timing)
    return { type: TTFB, value: round(perf.timing.responseStart - perf.timing.navigationStart), serverTiming: [] }
  return null
}

/**
 * Compute DOMContentLoaded event.
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event
 *
 * @param {PerformanceEntry[]} navEntries
 * @return {{ type: "dcl", value: number } | null}}
 */

function computeDcl([nav]) {
  if (nav) return { type: DCL, value: round(nav.domContentLoadedEventEnd) }
  if (perf && perf.timing)
    return { type: DCL, value: round(perf.timing.domContentLoadedEventEnd - perf.timing.navigationStart) }
  return null
}

/**
 * Compute DOMContentLoaded event.
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event
 *
 * @param {PerformanceEntry[]} navEntries
 * @return {{ type: "load", value: number } | null}}
 */

function computeLoad([nav]) {
  if (nav) return { type: OL, value: round(nav.loadEventEnd) }
  if (perf && perf.timing) return { type: OL, value: round(perf.timing.loadEventEnd - perf.timing.navigationStart) }
  return null
}

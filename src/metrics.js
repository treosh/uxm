import { observeEntries, getEntriesByType } from './performance-observer'
import { round, debug, onVisibilityChange, perf, raf } from './utils'
import { now } from './user-timing'

/** @typedef {'fcp' | 'lcp' | 'fid' | 'cls' | 'ttfb' | 'dcl' | 'load'} type */
/** @typedef {{ type: type, maxTimeout?: number, get?: function }} MetricOpts */
/** @typedef {(metric: object) => any} MetricObserverCallback */

const FCP = 'fcp'
const FID = 'fid'
const LCP = 'lcp'
const CLS = 'cls'
const TTFB = 'ttfb'
const DCL = 'dcl'
const OL = 'load'

/**
 * get metric by type using buffered values.
 *
 * @param {type} type
 * @return {Promise<Object | null>}
 */

export function getMetricByType(type) {
  const metric = normalizetype(type)
  switch (metric) {
    case FCP:
      return getEntriesByType('paint').then(entries => getFcp(entries))
    case FID:
      return getEntriesByType('first-input').then(entries => getFid(entries))
    case LCP:
      return getEntriesByType('largest-contentful-paint').then(entries => getLcp(entries))
    case CLS:
      return getEntriesByType('layout-shift').then(entries => getCls(entries))
    case TTFB:
    case DCL:
    case OL: {
      return new Promise(resolve => collectMetrics([metric], resolve))
    }
  }
}

/**
 * Observe `type`, if the value is already observed, return it.
 *
 * @param {Array<MetricOpts | type>} metricsOpts
 * @param {MetricObserverCallback} callback
 */

export function collectMetrics(metricsOpts, callback) {
  metricsOpts.forEach(metricOpts => {
    /** @type {MetricOpts} */
    const opts = typeof metricOpts === 'string' ? { type: metricOpts } : metricOpts
    const type = normalizetype(opts.type)
    switch (type) {
      case FCP: {
        observeEntries({ type: 'paint', buffered: true }, (paintEntries, fcpObserver) => {
          if (paintEntries.some(paintEntry => paintEntry.name === 'first-contentful-paint')) {
            debug(FCP)
            fcpObserver.disconnect()
            callback((opts.get || getFcp)(paintEntries))
          }
        })
        break
      }
      case FID: {
        observeEntries({ type: 'first-input', buffered: true }, (fidEntries, fidObserver) => {
          if (fidEntries.length) {
            debug(FID)
            fidObserver.disconnect()
            callback((opts.get || getFid)(fidEntries))
          }
        })
        break
      }

      case LCP: {
        const maxTimeout = opts.maxTimeout || 5000
        /** @type {NodeJS.Timeout | null} */
        let timeout = null
        /** @type {Object | null} */
        let lcpMetric = null
        /** @type {PerformanceObserver | null} */
        let lcpObserver = observeEntries({ type: 'largest-contentful-paint', buffered: true }, lcpEntries => {
          lcpMetric = (opts.get || getLcp)(lcpEntries)
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
      }

      case CLS: {
        /** @type {NodeJS.Timeout | null} */
        let timeout = null
        /** @type {PerformanceEntry[]} */
        let allLsEntries = []
        /** @type {PerformanceObserver | null} */
        let clsObserver = observeEntries({ type: 'layout-shift', buffered: true }, lsEntries => {
          allLsEntries.push(...lsEntries)
          if (timeout) clearTimeout(timeout)
          if (opts.maxTimeout) timeout = setTimeout(emitCls, opts.maxTimeout)
        })
        const emitCls = () => {
          if (!clsObserver) return
          debug(CLS)
          clsObserver.takeRecords()
          clsObserver.disconnect()
          clsObserver = null
          if (allLsEntries.length) callback((opts.get || getCls)(allLsEntries))
        }
        onVisibilityChange(emitCls)
        break
      }

      case TTFB:
      case DCL:
      case OL: {
        const resolveNavigationTimingMetrics = () => {
          getEntriesByType('navigation').then(navEntries => {
            debug('navigation')
            const get = opts.get || (type === TTFB ? getTtfb : type === DCL ? getDcl : getLoad)
            callback(get(navEntries))
          })
        }
        if (document.readyState !== 'complete') {
          debug('add "load" listener')
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
  })
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
 * Compute FCP metric.
 * https://web.dev/fcp/#measure-fcp-in-javascript
 *
 * @param {PerformanceEntry[]} paintEntries
 * @return {{ type: "fcp", value: number } | null}}
 */

function getFcp(paintEntries) {
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

function getFid([fidEntry]) {
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

function getLcp(lcpEntries) {
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

function getCls(lsEntries) {
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

function getTtfb([nav]) {
  if (nav) return { type: TTFB, value: round(nav.responseStart), serverTiming: nav.serverTiming || [] }
  if (perf && perf.timing)
    return { type: TTFB, value: round(perf.timing.responseStart - perf.timing.navigationStart), serverTiming: [] }
  return null
}

/**
 * Compute "DOMContentLoaded" event.
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event
 *
 * @param {PerformanceEntry[]} navEntries
 * @return {{ type: "dcl", value: number } | null}}
 */

function getDcl([nav]) {
  if (nav) return { type: DCL, value: round(nav.domContentLoadedEventEnd) }
  if (perf && perf.timing)
    return { type: DCL, value: round(perf.timing.domContentLoadedEventEnd - perf.timing.navigationStart) }
  return null
}

/**
 * Compute "load" event.
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event
 *
 * @param {PerformanceEntry[]} navEntries
 * @return {{ type: "load", value: number } | null}}
 */

function getLoad([nav]) {
  if (nav) return { type: OL, value: round(nav.loadEventEnd) }
  if (perf && perf.timing) return { type: OL, value: round(perf.timing.loadEventEnd - perf.timing.navigationStart) }
  return null
}

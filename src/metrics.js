import { isObject, round, getSelector, perf } from './utils'
import { observeEntries } from './performance-observer'
import { now } from './user-timing'
import { onVisibilityChange } from './utils/visibility-change'
import { onLoad } from './utils/load'

/** @typedef {{ metricType: 'fcp', value: number }} FcpMetric */
/** @typedef {{ metricType: 'fid', value: number, detail: { startTime: number, duration: number, processingStart: number, processingEnd: number, name: string } }} FidMetric */
/** @typedef {{ metricType: 'lcp', value: number, detail: { size: number, elementSelector: ?string } }} LcpMetric */
/** @typedef {{ metricType: 'cls', value: number, detail: { totalEntries: number, sessionDuration: number } }} ClsMetric */
/** @typedef {{ metricType: 'load', value: number, detail: { timeToFirstByte: number, domContentLoaded: number } }} LoadMetric */
/** @typedef {'fcp' | 'lcp' | 'fid' | 'cls'} MetricType */
/** @typedef {{ type: MetricType, maxTimeout?: number }} CollectMetricOpts */

const FCP = 'fcp'
const FID = 'fid'
const LCP = 'lcp'
const CLS = 'cls'

/**
 * Collect metrics.
 *
 * @param {(MetricType | CollectMetricOpts)[]} metricsOpts
 * @param {(metric: FcpMetric | LcpMetric | ClsMetric | FidMetric) => any} cb
 */

export function collectMetrics(metricsOpts, cb) {
  metricsOpts.forEach((metricOpts) => {
    const opts = /** @type {CollectMetricOpts} */ (isObject(metricOpts) ? metricOpts : { type: metricOpts })
    const metricType = opts.type.toLowerCase()
    if (metricType === FCP) {
      return collectFcp(cb)
    } else if (metricType === FID) {
      return collectFid(cb)
    } else if (metricType === LCP) {
      return collectLcp(cb, opts)
    } else if (metricType === CLS) {
      return collectCls(cb, opts)
    } else {
      throw new Error(`Invalid metric type: ${opts.type}`)
    }
  })
}

/** @param {(metric: FcpMetric) => any} cb */
export function collectFcp(cb) {
  observeEntries('paint', (paintEntries, fcpObserver) => {
    if (paintEntries.some((paintEntry) => paintEntry.name === 'first-contentful-paint')) {
      fcpObserver.disconnect()
      const paintEntry = paintEntries.filter((e) => e.name === 'first-contentful-paint')[0]
      cb({ metricType: FCP, value: round(paintEntry.startTime) })
    }
  })
}

/** @param {(metric: FidMetric) => any} cb */
export function collectFid(cb) {
  observeEntries('first-input', ([fidEntry], fidObserver) => {
    if (fidEntry) {
      fidObserver.disconnect()
      cb({
        metricType: FID,
        value: round(fidEntry.processingStart - fidEntry.startTime), // delay
        detail: {
          duration: fidEntry.duration, // input duration
          startTime: round(fidEntry.startTime, 2),
          processingStart: round(fidEntry.processingStart, 2),
          processingEnd: round(fidEntry.processingEnd, 2),
          name: fidEntry.name,
        },
      })
    }
  })
}

/** @param {(metric: LcpMetric) => any} cb */
export function collectLcp(cb, opts = {}) {
  const maxTimeout = opts.maxTimeout || 10000
  /** @type {NodeJS.Timeout | null} */
  let timeout = null
  /** @type {LcpMetric | null} */
  let lcpMetric = null
  /** @type {PerformanceObserver | null} */
  let lcpObserver = observeEntries('largest-contentful-paint', (lcpEntries) => {
    const lcpEntry = lcpEntries[lcpEntries.length - 1]
    lcpMetric = {
      metricType: LCP,
      value: round(lcpEntry.renderTime || lcpEntry.loadTime),
      detail: {
        size: lcpEntry.size,
        elementSelector: lcpEntry.element
          ? `${getSelector(lcpEntry.element.parentElement)} > ${getSelector(lcpEntry.element)}`
          : null,
      },
    }
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(emitLcp, maxTimeout)
  })
  /** @type {PerformanceObserver | null} */
  let fidObserver = observeEntries('first-input', emitLcp)

  onVisibilityChange(emitLcp)

  function emitLcp() {
    if (!lcpObserver || !fidObserver) return
    lcpObserver.takeRecords() // force pending values
    lcpObserver.disconnect()
    lcpObserver = null
    fidObserver.disconnect()
    fidObserver = null
    if (timeout) clearTimeout(timeout)
    if (lcpMetric) cb(lcpMetric)
  }
}

/** @param {(metric: ClsMetric) => any} cb */
export function collectCls(cb, opts = {}) {
  /** @type {NodeJS.Timeout | null} */
  let timeout = null
  let cummulativeValue = 0
  let totalEntries = 0
  /** @type {PerformanceObserver | null} */
  let clsObserver = observeEntries('layout-shift', (lsEntries) => {
    const cls = lsEntries.reduce((memo, lsEntry) => {
      // Only count layout shifts without recent user input.
      // and collect percentage value
      if (!lsEntry.hadRecentInput) memo += lsEntry.value
      return memo
    }, 0)
    cummulativeValue += cls
    totalEntries += lsEntries.length
    if (timeout) clearTimeout(timeout)
    if (opts.maxTimeout) timeout = setTimeout(emitCls, opts.maxTimeout)
  })
  onVisibilityChange(emitCls)

  function emitCls() {
    if (!clsObserver) return
    clsObserver.takeRecords()
    clsObserver.disconnect()
    clsObserver = null
    if (timeout) clearTimeout(timeout)
    if (totalEntries > 0) {
      cb({ metricType: CLS, value: round(cummulativeValue, 4), detail: { totalEntries, sessionDuration: now() } })
    }
  }
}

/** @param {(metric: LoadMetric) => any} cb */
export function collectLoad(cb) {
  onLoad(() => {
    if (!perf || !perf.timing) return
    const t = perf.timing
    cb({
      metricType: 'load',
      value: round(t.loadEventEnd - t.navigationStart),
      detail: {
        timeToFirstByte: round(t.responseStart - t.navigationStart),
        domContentLoaded: round(t.domContentLoadedEventEnd - t.navigationStart),
      },
    })
  })
}

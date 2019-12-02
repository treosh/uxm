import { createPerformanceObserver, getEntriesByType } from './performance-observer'
import { round, debug, onVisibilityChange } from './utils'
import { now } from './user-timing'

/** @typedef {'first-contentful-paint' | 'first-input-delay' | 'largest-contentful-paint' | 'cumulative-layout-shift'} StrictMetricType */
/** @typedef {StrictMetricType | 'fcp' | 'lcp' | 'fid' | 'cls'} MetricType */
/** @typedef {{ type: MetricType, maxTimeout?: number, map?: function }} MetricOpts */
/** @typedef {(metric: object) => any} MetricObserverCallback */

const FCP = 'first-contentful-paint'
const FID = 'first-input-delay'
const LCP = 'largest-contentful-paint'
const CLS = 'cumulative-layout-shift'

/**
 * Observer multiple metrics.
 *
 * @param {Array<MetricOpts | MetricType>} metricsOpts
 * @param {MetricObserverCallback} callback
 */

export function observeMetrics(metricsOpts, callback) {
  metricsOpts.forEach(metricOpts => createMetricObserver(metricOpts, callback))
}

/**
 * Compute metric by type using buffered values.
 *
 * @param {MetricType} metricType
 * @return {Promise<Object | null>}
 */

export function getMetricByType(metricType) {
  const metric = normalizeMetricType(metricType)
  const entryType = metric === FID ? 'first-input' : metric === CLS ? 'layout-shift' : metric
  const map = metric === FCP ? mapFcp : metric === FID ? mapFid : metric === LCP ? mapLcp : mapCls
  return getEntriesByType(entryType).then(entries => map(entries))
}

/**
 * Observe `metricType`, if the value is already observed, return it.
 *
 * @param {MetricOpts | MetricType} metricOpts
 * @param {MetricObserverCallback} callback
 */

export function createMetricObserver(metricOpts, callback) {
  /** @type {MetricOpts} */
  const opts = typeof metricOpts === 'string' ? { type: metricOpts } : metricOpts
  switch (normalizeMetricType(opts.type)) {
    case FCP:
      createPerformanceObserver({ type: FCP, buffered: true }, (paintEntries, fcpObserver) => {
        if (paintEntries.some(paintEntry => paintEntry.name === FCP)) {
          debug(FCP)
          fcpObserver.disconnect()
          callback((opts.map || mapFcp)(paintEntries))
        }
      })
      break
    case FID:
      createPerformanceObserver({ type: 'first-input', buffered: true }, (fidEntries, fidObserver) => {
        if (fidEntries.length) {
          debug(FID)
          fidObserver.disconnect()
          callback((opts.map || mapFid)(fidEntries))
        }
      })
      break

    /**
     * Trigger LCP metric:
     * - on maxTimeout
     * - on visibility change
     */

    case LCP:
      const maxTimeout = opts.maxTimeout || 5000
      /** @type {NodeJS.Timeout | null} */
      let timeout = null
      /** @type {PerformanceEntry[]} */
      let allLcpEntries = []
      /** @type {PerformanceObserver | null} */
      let lcpObserver = createPerformanceObserver({ type: LCP, buffered: true }, lcpEntries => {
        allLcpEntries.push(...lcpEntries)
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(emitLcp, maxTimeout)
      })
      const emitLcp = () => {
        if (!lcpObserver) return
        debug(LCP)
        lcpObserver.takeRecords() // force pending values
        lcpObserver.disconnect()
        lcpObserver = null
        if (allLcpEntries.length) callback((opts.map || mapLcp)(allLcpEntries))
      }
      onVisibilityChange(emitLcp)
      break

    /**
     * Trigger CLS metric:
     * - on visibility change
     */

    case CLS:
      /** @type {PerformanceEntry[]} */
      let allLsEntries = []
      /** @type {PerformanceObserver | null} */
      let clsObserver = createPerformanceObserver({ type: 'layout-shift', buffered: true }, lsEntries => {
        allLsEntries.push(...lsEntries)
      })
      const emitCls = () => {
        if (!clsObserver) return
        debug(CLS)
        clsObserver.takeRecords()
        clsObserver.disconnect()
        clsObserver = null
        if (allLsEntries.length) callback((opts.map || mapCls)(allLsEntries))
      }
      onVisibilityChange(emitCls)
      break
  }
}

/**
 * Normalize `metricType` to strict names.
 *
 * @param {MetricType} metricType
 * @return {StrictMetricType}
 */

function normalizeMetricType(metricType) {
  const m = metricType.toLowerCase()
  const metric = m === 'fcp' ? FCP : m === 'fid' ? FID : m === 'lcp' ? LCP : m === 'cls' ? CLS : m
  if ([FCP, FID, LCP, CLS].indexOf(metric) === -1) throw new Error(`Invalid metric: ${metricType}`)
  // @ts-ignore
  return metric
}

/**
 * Map FCP entry.
 *
 * @param {PerformanceEntry[]} paintEntries
 * @return {{ metricType: "first-contentful-paint", value: number } | null}}
 */

function mapFcp(paintEntries) {
  const paintEntry = paintEntries.length ? paintEntries.filter(e => e.name === FCP)[0] : null
  return paintEntry ? { metricType: FCP, value: round(paintEntry.startTime) } : null
}

/**
 * Map FID entry.
 *
 * @param {PerformanceEntry[]} fidEntries
 * @return {{ metricType: "first-input-delay", value: number, startTime: number, name: string } | null}}
 */

function mapFid([fidEntry]) {
  return fidEntry
    ? {
        metricType: FID,
        value: round(fidEntry.processingStart - fidEntry.startTime),
        startTime: round(fidEntry.startTime),
        name: fidEntry.name
      }
    : null
}

/**
 * Map LCP entry.
 *
 * @param {PerformanceEntry[]} lcpEntries
 * @return {{ metricType: "largest-contentful-paint", value: number, size: number, elementSelector: string | null } | null}}
 */

function mapLcp(lcpEntries) {
  const lcpEntry = lcpEntries.length ? lcpEntries[lcpEntries.length - 1] : null
  return lcpEntry
    ? {
        metricType: LCP,
        value: round(lcpEntry.renderTime || lcpEntry.loadTime),
        size: lcpEntry.size,
        elementSelector: lcpEntry.element
          ? `${lcpEntry.element.tagName.toLowerCase()}.${lcpEntry.element.className.replace(/ /g, '.')}`
          : null
      }
    : null
}

/**
 * Map CLS entries.
 *
 * @param {PerformanceEntry[]} lsEntries
 * @return {{ metricType: "cumulative-layout-shift", value: number, totalEntries: number, sessionDuration: number }}}
 */

function mapCls(lsEntries) {
  const cls = lsEntries.reduce((memo, lsEntry) => {
    // Only count layout shifts without recent user input.
    // and collect percentage value
    if (!lsEntry.hadRecentInput) memo += 100 * lsEntry.value
    return memo
  }, 0)
  return { metricType: CLS, value: round(cls, 3), totalEntries: lsEntries.length, sessionDuration: round(now()) }
}

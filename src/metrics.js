import { isObject, round } from './utils'
import { observeEntries } from './performance-observer'

const FCP = 'fcp'
const FID = 'fid'
const LCP = 'lcp'
const CLS = 'cls'

/**
 * Collect metrics
 *
 * @param {(MetricType | { type: MetricType, maxTimeout?: number })[]} metricsOpts
 * @param {(metric: { metric: string, value: number, detail?: object }) => any} cb
 */

export function collectMetrics(metricsOpts, cb) {
  metricsOpts.forEach(metricOpts => {
    const opts = /** @type {{ type: MetricType, maxTimeout?: number }} */ (isObject(metricOpts)
      ? metricOpts
      : { type: metricOpts })
    if (opts.type === FCP) {
      observeEntries('paint', (paintEntries, fcpObserver) => {
        if (paintEntries.some(paintEntry => paintEntry.name === 'first-contentful-paint')) {
          fcpObserver.disconnect()
          const paintEntry = paintEntries.filter(e => e.name === 'first-contentful-paint')[0]
          cb({ metric: FCP, value: round(paintEntry.startTime) })
        }
      })
    } else if (opts.type === FID) {
      observeEntries('first-input', ([fidEntry], fidObserver) => {
        if (fidEntry) {
          fidObserver.disconnect()
          cb({
            metric: FID,
            value: round(fidEntry.processingStart - fidEntry.startTime),
            detail: { startTime: round(fidEntry.startTime), name: fidEntry.name }
          })
        }
      })
    } else if (opts.type === LCP) {
      const maxTimeout = opts.maxTimeout || 5000
      /** @type {NodeJS.Timeout | null} */
      let timeout = null
      /** @type {Object | null} */
      let lcpMetric = null
      /** @type {PerformanceObserver | null} */
      let lcpObserver = observeEntries('largest-contentful-paint', lcpEntries => {
        lcpMetric = getLcp(lcpEntries)
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(emitLcp, maxTimeout)
      })
      onVisibilityChange(emitLcp)

      function emitLcp() {
        if (!lcpObserver) return
        lcpObserver.takeRecords() // force pending values
        lcpObserver.disconnect()
        lcpObserver = null
        if (timeout) clearTimeout(timeout)
        if (lcpMetric) cb(lcpMetric)
      }
    } else if (opts.type === CLS) {
      /** @type {NodeJS.Timeout | null} */
      let timeout = null
      /** @type {LayoutShift[]} */
      let allLsEntries = []
      /** @type {PerformanceObserver | null} */
      let clsObserver = observeEntries({ type: 'layout-shift', buffered: true }, lsEntries => {
        allLsEntries.push(...lsEntries)
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
        cb(getCls(allLsEntries))
      }
    } else {
      throw new Error(`Invalid metric type: ${opts.type}`)
    }
  })
}

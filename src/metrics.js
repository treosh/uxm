import { observeEntries } from './performance-observer'
import { now } from './user-timing'
import { isObject, round } from './utils'
import { onVisibilityChange } from './utils/visibility-change'

/** @typedef {{ metric: string, value: number, detail?: object }} Metric */
/** @typedef {{ type: MetricType, maxTimeout?: number }} CollectMetricOpts */

const FCP = 'fcp'
const FID = 'fid'
const LCP = 'lcp'
const CLS = 'cls'

/**
 * Collect metrics.
 *
 * @param {(MetricType | CollectMetricOpts)[]} metricsOpts
 * @param {(metric: Metric) => any} cb
 */

export function collectMetrics(metricsOpts, cb) {
  metricsOpts.forEach(metricOpts => {
    const opts = /** @type {CollectMetricOpts} */ (isObject(metricOpts) ? metricOpts : { type: metricOpts })
    const metricType = opts.type.toLowerCase()
    if (metricType === FCP) {
      observeEntries('paint', (paintEntries, fcpObserver) => {
        if (paintEntries.some(paintEntry => paintEntry.name === 'first-contentful-paint')) {
          fcpObserver.disconnect()
          const paintEntry = paintEntries.filter(e => e.name === 'first-contentful-paint')[0]
          cb({ metric: FCP, value: round(paintEntry.startTime) })
        }
      })
    } else if (metricType === FID) {
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
    } else if (metricType === LCP) {
      const maxTimeout = opts.maxTimeout || 5000
      /** @type {NodeJS.Timeout | null} */
      let timeout = null
      /** @type {Metric | null} */
      let lcpMetric = null
      /** @type {PerformanceObserver | null} */
      let lcpObserver = observeEntries('largest-contentful-paint', lcpEntries => {
        const lcpEntry = lcpEntries[lcpEntries.length - 1]
        lcpMetric = {
          metric: LCP,
          value: round(lcpEntry.renderTime || lcpEntry.loadTime),
          detail: {
            size: lcpEntry.size,
            elementSelector: lcpEntry.element
              ? `${getSelector(lcpEntry.element.parentElement)} > ${getSelector(lcpEntry.element)}`
              : null
          }
        }
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
    } else if (metricType === CLS) {
      /** @type {NodeJS.Timeout | null} */
      let timeout = null
      let cummulativeValue = 0
      let totalEntries = 0
      /** @type {PerformanceObserver | null} */
      let clsObserver = observeEntries({ type: 'layout-shift', buffered: true }, lsEntries => {
        const cls = lsEntries.reduce((memo, lsEntry) => {
          // Only count layout shifts without recent user input.
          // and collect percentage value
          if (!lsEntry.hadRecentInput) memo += 100 * lsEntry.value
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
        cb({ metric: CLS, value: cummulativeValue, detail: { totalEntries, sessionDuration: round(now()) } })
      }
    } else {
      throw new Error(`Invalid metric type: ${opts.type}`)
    }
  })
}

/** @param {Element | null} el */
function getSelector(el) {
  return el ? `${el.tagName.toLowerCase()}${el.className ? '.' : ''}${el.className.replace(/ /g, '.')}` : null
}

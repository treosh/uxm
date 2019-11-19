import { getEventsByType, createEventsObserver } from './performance-observer'
import { round, debug } from './utils'

/** @typedef {'first-contentful-paint' | 'first-input-delay' | 'largest-contentful-paint' | 'cumulative-layout-shift'} StrictMetricType */
/** @typedef {StrictMetricType | 'fcp' | 'lcp' | 'fid' | 'cls'} MetricType */
/** @typedef {(metric: number | null) => any} MetricObserverCallback */

const FCP = 'first-contentful-paint'
const FID = 'first-input-delay'
const LCP = 'largest-contentful-paint'
const CLS = 'cumulative-layout-shift'
const visibilityChange = 'visibilitychange'

/**
 * Get metric by `metricType`.
 * It performs immediate compute without waiting for an appropriate condition.
 *
 * @param {MetricType} metricType
 * @return {Promise<number | null>}
 */

export function getMetricByType(metricType) {
  const metric = normalizeMetricType(metricType)
  const eventType = metric === FID ? 'first-input' : metric === CLS ? 'layout-shift' : metric
  return getEventsByType(eventType).then(events => {
    switch (metric) {
      case FCP:
        return computeFcp(events)
      case LCP:
        return computeLcp(events)
      case FID:
        return computeFid(events)
      case CLS:
        return computeCls(events)
    }
  })
}

/**
 * Observe `metricType`, if the value is already observed, return it.
 *
 * @param {MetricType} metricType
 * @param {MetricObserverCallback} callback
 */

export function createMetricObserver(metricType, callback) {
  const opts = { buffered: true }
  switch (normalizeMetricType(metricType)) {
    case FCP:
      const fcpObserver = createEventsObserver(
        FCP,
        paintEvents => {
          const fcp = computeFcp(paintEvents)
          if (fcp) {
            fcpObserver.disconnect()
            callback(fcp)
          }
        },
        opts
      )
      break
    case FID:
      const fidObserver = createEventsObserver(
        'first-input',
        fidEvents => {
          fidObserver.disconnect()
          callback(computeFid(fidEvents))
        },
        opts
      )
      break
    case LCP:
      let lcp = 0
      let lcpVisibilityChangeListener = () => {
        debug('%s %s', visibilityChange, LCP)
        lcpObserver.disconnect()
        document.removeEventListener(visibilityChange, lcpVisibilityChangeListener, true)
        callback(lcp)
      }
      let lcpObserver = createEventsObserver(LCP, lcpEvents => (lcp = computeLcp(lcpEvents)), opts)
      document.addEventListener(visibilityChange, lcpVisibilityChangeListener, true)
      break
    case CLS:
      let cls = 0
      let clsVisibilityChangeListener = () => {
        debug('%s %s', visibilityChange, CLS)
        clsObserver.takeRecords()
        clsObserver.disconnect()
        document.removeEventListener(visibilityChange, clsVisibilityChangeListener, true)
        callback(cls)
      }
      let clsObserver = createEventsObserver('layout-shift', lsEvents => (cls += computeCls(lsEvents)), opts)
      document.addEventListener(visibilityChange, clsVisibilityChangeListener, true)
      break
  }
}

/** @param {PerformanceEntry[]} paintEvents */
function computeFcp(paintEvents) {
  const [fcpEvent] = paintEvents.filter(e => e.name === FCP)
  return fcpEvent ? round(fcpEvent.startTime) : null
}

/** @param {PerformanceEntry[]} lcpEvents */
function computeLcp(lcpEvents) {
  const lastLcpEvent = lcpEvents[lcpEvents.length - 1]
  return round(lastLcpEvent.renderTime || lastLcpEvent.loadTime)
}

/** @param {PerformanceEntry[]} fidEvents */
function computeFid([fidEvent]) {
  return fidEvent ? round(fidEvent.processingStart - fidEvent.startTime) : null
}

/** @param {PerformanceEntry[]} lsEvents */
function computeCls(lsEvents) {
  const cls = lsEvents.reduce((memo, lsEvent) => {
    // Only count layout shifts without recent user input.
    // and collect percentage value
    if (!lsEvent.hadRecentInput) memo += 100 * lsEvent.value
    return memo
  }, 0)
  return round(cls, 3)
}

/** @param {MetricType} metricType @return {StrictMetricType} */
function normalizeMetricType(metricType) {
  const m = metricType.toLowerCase()
  const metric = m === 'fcp' ? FCP : m === 'fid' ? FID : m === 'lcp' ? LCP : m === 'cls' ? CLS : m
  if ([FCP, FID, LCP, CLS].indexOf(metric) === -1) throw new Error(`Invalid metric: ${metricType}`)
  // @ts-ignore
  return metric
}

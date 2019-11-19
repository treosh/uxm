import { getEventsByType } from './performance-observer'
import { round } from './utils'

/** @typedef {'first-contentful-paint' | 'first-input-delay' | 'largest-contentful-paint' | 'cumulative-layout-shift'} StrictMetricType */
/** @typedef {StrictMetricType | 'fcp' | 'lcp' | 'fid' | 'cls'} MetricType */
/** @typedef {(metric: number | null) => any} PerformanceMetricCallback */

const FCP = 'first-contentful-paint'
const FID = 'first-input-delay'
const LCP = 'largest-contentful-paint'
const CLS = 'cumulative-layout-shift'

/**
 * Get metric by `metricType`.
 * It performs immediate compute without waiting for an appropriate condition.
 *
 * @param {MetricType} metricType
 * @return {Promise<number | null>}
 */

export function getMetricByType(metricType) {
  const metric = normalizeMetricType(metricType)
  switch (metric) {
    case FCP:
      return getFcp()
    case FID:
      return getFid()
    case LCP:
      return getLcp()
    case CLS:
      return getCls()
    default:
      throw new Error(`Invalid metric: ${metricType}`)
  }
}

function getFcp() {
  return getEventsByType(FCP).then(paintEvents => {
    const fcpEvent = paintEvents.find(e => e.name === FCP)
    return fcpEvent ? round(fcpEvent.startTime) : null
  })
}

function getLcp() {
  return getEventsByType(LCP).then(lcpEvents => {
    if (!lcpEvents.length) return null
    const lastLcpEvent = lcpEvents[lcpEvents.length - 1]
    return round(lastLcpEvent.renderTime || lastLcpEvent.loadTime)
  })
}

function getFid() {
  return getEventsByType('first-input').then(([fidEvent]) => {
    return fidEvent ? round(fidEvent.processingStart - fidEvent.startTime) : null
  })
}

function getCls() {
  return getEventsByType('layout-shift').then(lsEvents => {
    if (!lsEvents.length) return null
    const cls = lsEvents.reduce((memo, lsEvent) => {
      // Only count layout shifts without recent user input.
      // and collect percentage value
      if (!lsEvent.hadRecentInput) memo += 100 * lsEvent.value
      return memo
    }, 0)
    return round(cls, 3)
  })
}

/** @param {MetricType} metricType @return {string} */
function normalizeMetricType(metricType) {
  const metric = metricType.toLowerCase()
  return metric === 'fcp' ? FCP : metric === 'fid' ? FID : metric === 'lcp' ? LCP : metric === 'cls' ? CLS : metric
}

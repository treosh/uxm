import { getDeviceType } from './device'
import { getFirstInteractive } from './first-interactive'
import { getConsistentlyInteractive } from './consistently-interactive'
const perf = typeof window !== 'undefined' ? window.performance : null

// expose extra API

export { getDeviceType, getFirstInteractive, getConsistentlyInteractive }

// get all metrics

export function uxm() {
  const result = {
    deviceType: getDeviceType(),
    deviceMemory: getDeviceMemory(),
    connection: getConnection(),
    firstPaint: getFirstPaint(),
    firstContentfulPaint: getFirstContentfulPaint(),
    onLoad: getOnLoad(),
    domContentLoaded: getDomContentLoaded(),
    marks: getMarks(),
    measures: getMeasures(),
    longTasks: getLongTasks()
  }
  result.firstInteractive = getFirstInteractive(result)
  result.consistentlyInteractive = getConsistentlyInteractive(result)
  return result
}

// custom metrics helpers

export function mark(markName) {
  if (perf && perf.mark) {
    perf.mark(markName)
  }
}

export function measure(measureName, startMarkName) {
  if (perf && perf.measure) {
    try {
      perf.measure(measureName, startMarkName)
    } catch (err) {
      console.error(err)
    }
  }
}

// metric utils

export function getDeviceMemory() {
  const memory = typeof navigator !== 'undefined' ? navigator.deviceMemory : null
  return memory || null
}

export function getConnection() {
  const conn =
    typeof navigator !== 'undefined'
      ? navigator.connection || navigator.mozConnection || navigator.webkitConnection
      : null
  return conn ? { rtt: conn.rtt, downlink: conn.downlink, effectiveType: conn.effectiveType } : null
}

export function getFirstPaint() {
  if (typeof PerformancePaintTiming === 'undefined') return null
  const fp = perf.getEntriesByType('paint').find(({ name }) => name === 'first-paint')
  return fp ? Math.round(fp.startTime) : null
}

export function getFirstContentfulPaint() {
  if (typeof PerformancePaintTiming === 'undefined') return null
  const fcp = perf.getEntriesByType('paint').find(({ name }) => name === 'first-contentful-paint')
  return fcp ? Math.round(fcp.startTime) : null
}

export function getOnLoad() {
  if (!perf || !perf.timing) return null
  return perf.timing.loadEventEnd - perf.timing.fetchStart
}

export function getDomContentLoaded() {
  if (!perf || !perf.timing) return null
  return perf.timing.domContentLoadedEventEnd - perf.timing.fetchStart
}

export function getMarks() {
  if (!perf || typeof PerformanceMark === 'undefined') return null
  return perf.getEntriesByType('mark').reduce((memo, mark) => {
    memo[mark.name] = Math.round(mark.startTime)
    return memo
  }, {})
}

export function getMeasures() {
  if (!perf || typeof PerformanceMeasure === 'undefined') return null
  return perf.getEntriesByType('measure').reduce((memo, measure) => {
    memo[measure.name] = Math.round(measure.duration)
    return memo
  }, {})
}

export function getResources() {
  if (!perf || typeof PerformanceResourceTiming === 'undefined') return null
  const documentEntry = { type: 'document', startTime: 0, duration: perf.timing.responseEnd - perf.timing.fetchStart }
  return [documentEntry].concat(
    perf.getEntriesByType('resource').map(resource => ({
      type: resource.initiatorType,
      size: resource.transferSize,
      startTime: Math.round(resource.startTime),
      duration: Math.round(resource.duration)
    }))
  )
}

export function getLongTasks() {
  if (typeof window.__lt === 'undefined') return null
  return window.__lt.e.map(longTask => ({
    startTime: Math.round(longTask.startTime),
    duration: Math.round(longTask.duration)
  }))
}

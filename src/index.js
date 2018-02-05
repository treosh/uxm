import { getDeviceType } from './device'
const perf = typeof window !== 'undefined' ? window.performance : null

// public methods

export function metrics() {
  return {
    device: getDeviceType(),
    memory: getDeviceMemory(),
    connection: getConnection(),
    metrics: {
      firstPaint: getFirstPaint(),
      firstContentfulPaint: getFirstContentfulPaint(),
      onLoad: getOnLoad(),
      domContentLoaded: getDomContentLoaded()
    },
    marks: getMarks(),
    measures: getMeasures()
  }
}

export function mark(markName) {
  if (perf && perf.mark) {
    window.performance.mark(markName)
  }
}

export function measure(measureName, startMarkName) {
  if (perf && perf.measure) {
    try {
      window.performance.measure(measureName, startMarkName)
    } catch (err) {
      console.error(err)
    }
  }
}

// utils

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
  if (typeof PerformanceMark === 'undefined') return null
  return perf.getEntriesByType('mark').reduce((memo, entry) => {
    memo[entry.name] = Math.round(entry.startTime)
    return memo
  }, {})
}

export function getMeasures() {
  if (typeof PerformanceMeasure === 'undefined') return null
  return perf.getEntriesByType('measure').reduce((memo, entry) => {
    memo[entry.name] = Math.round(entry.duration)
    return memo
  }, {})
}

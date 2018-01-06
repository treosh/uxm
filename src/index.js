import { getDeviceType } from './device'
const perf = typeof window !== 'undefined' ? window.performance : null

// public methods

export { getDeviceType }
export function metrics() {
  return {
    device: {
      type: getDeviceType(),
      memory: getDeviceMemory(),
      effectiveConnectionType: getEffectiveConnectionType()
    },
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

function getDeviceMemory() {
  const memory = typeof navigator !== 'undefined' ? navigator.deviceMemory : null
  return memory ? (memory < 1 ? 'lite' : 'full') : null
}

function getEffectiveConnectionType() {
  const conn =
    typeof navigator !== 'undefined'
      ? navigator.connection || navigator.mozConnection || navigator.webkitConnection
      : null
  return conn ? conn.effectiveType : null
}

function getFirstPaint() {
  if (typeof PerformancePaintTiming === 'undefined') return null
  const fp = perf.getEntriesByType('paint').find(({ name }) => name === 'first-paint')
  return fp ? Math.round(fp.startTime) : null
}

function getFirstContentfulPaint() {
  if (typeof PerformancePaintTiming === 'undefined') return null
  const fcp = perf.getEntriesByType('paint').find(({ name }) => name === 'first-contentful-paint')
  return fcp ? Math.round(fcp.startTime) : null
}

function getOnLoad() {
  if (!perf || !perf.timing) return null
  return perf.timing.loadEventEnd - perf.timing.fetchStart
}

function getDomContentLoaded() {
  if (!perf || !perf.timing) return null
  return perf.timing.domContentLoadedEventEnd - perf.timing.fetchStart
}

function getMarks() {
  if (!perf || !perf.getEntriesByType) return null
  return perf.getEntriesByType('mark').reduce((memo, entry) => {
    memo[entry.name] = Math.round(entry.startTime)
    return memo
  }, {})
}

function getMeasures() {
  if (!perf || !perf.getEntriesByType) return null
  return perf.getEntriesByType('measure').reduce((memo, entry) => {
    memo[entry.name] = Math.round(entry.duration)
    return memo
  }, {})
}

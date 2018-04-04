import { getDeviceType } from './device'
const perf = typeof window !== 'undefined' ? window.performance : null

// get all metrics

export function uxm() {
  const result = {
    deviceType: getDeviceType(),
    deviceMemory: getDeviceMemory(),
    effectiveConnectionType: getEffectiveConnectionType(),
    firstPaint: getFirstPaint(),
    firstContentfulPaint: getFirstContentfulPaint(),
    domContentLoaded: getDomContentLoaded(),
    onLoad: getOnLoad(),
    userTiming: getUserTiming()
  }
  return result
}

// expose extra API

export { getDeviceType }

// user timing helpers

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
  return memory > 1 ? 'full' : 'lite'
}

export function getEffectiveConnectionType() {
  const conn =
    typeof navigator !== 'undefined'
      ? navigator.connection || navigator.mozConnection || navigator.webkitConnection
      : null
  return conn ? conn.effectiveType : null
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

export function getUserTiming() {
  if (!perf || typeof PerformanceMark === 'undefined') return null
  const marks = perf.getEntriesByType('mark').map(mark => {
    return { type: 'mark', name: mark.name, startTime: Math.round(mark.startTime) }
  })
  const measures = perf.getEntriesByType('measure').map(measure => {
    return {
      type: 'measure',
      name: measure.name,
      startTime: Math.round(measure.startTime),
      duration: Math.round(measure.duration)
    }
  })
  return marks.concat(measures)
}

export function getResources() {
  if (!perf || typeof PerformanceResourceTiming === 'undefined') return null
  const documentEntry = { type: 'document', startTime: 0, duration: perf.timing.responseEnd - perf.timing.fetchStart }
  const resources = perf.getEntriesByType('resource').map(resource => {
    return {
      type: resource.initiatorType,
      size: resource.transferSize,
      startTime: Math.round(resource.startTime),
      duration: Math.round(resource.duration)
    }
  })
  return [documentEntry].concat(resources)
}

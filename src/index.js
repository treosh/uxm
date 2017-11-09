const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
const perf = window.performance

export function metrics() {
  return {
    effectiveConnectionType: effectiveConnectionType(),
    metrics: {
      firstPaint: firstPaint(),
      firstContentfulPaint: firstContentfulPaint(),
      firstInteractive: firstInteractive(),
      onLoad: onLoad(),
      domContentLoaded: domContentLoaded()
    },
    customMetrics: customMetrics()
  }
}

// utils

function effectiveConnectionType() {
  return conn ? conn.effectiveType : ''
}

function firstPaint() {
  if (typeof PerformancePaintTiming === 'undefined') return 0
  const fp = perf.getEntriesByType('paint').find(({ name }) => name === 'first-paint')
  return fp ? Math.round(fp.startTime) : 0
}

function firstContentfulPaint() {
  if (typeof PerformancePaintTiming === 'undefined') return 0
  const fcp = perf.getEntriesByType('paint').find(({ name }) => name === 'first-contentful-paint')
  return fcp ? Math.round(fcp.startTime) : 0
}

function firstInteractive() {
  if (!perf || !perf.now) return 0
  return Math.round(perf.now())
}

function onLoad() {
  if (!perf || !perf.timing) return 0
  return perf.timing.loadEventEnd - perf.timing.fetchStart
}

function domContentLoaded() {
  if (!perf || !perf.timing) return 0
  return perf.timing.domContentLoadedEventEnd - perf.timing.fetchStart
}

function customMetrics() {
  if (!perf || !perf.getEntriesByType) return {}
  const entries = perf.getEntriesByType('mark').concat(perf.getEntriesByType('measure'))
  return entries.reduce((memo, entry) => {
    memo[entry.name] = Math.round(entry.entryType === 'mark' ? entry.startTime : entry.duration)
    return memo
  }, {})
}

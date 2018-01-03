const perf = typeof window !== 'undefined' ? window.performance : null
const conn =
  typeof navigator !== 'undefined'
    ? navigator.connection || navigator.mozConnection || navigator.webkitConnection
    : null

// public methods

export function metrics() {
  return {
    effectiveConnectionType: getEffectiveConnectionType(),
    metrics: {
      firstPaint: getFirstPaint(),
      firstContentfulPaint: getFirstContentfulPaint(),
      onLoad: getOnLoad(),
      domContentLoaded: getDomContentLoaded()
    },
    now: getNow(),
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

function getEffectiveConnectionType() {
  return conn ? conn.effectiveType : ''
}

function getFirstPaint() {
  if (typeof PerformancePaintTiming === 'undefined') return 0
  const fp = perf.getEntriesByType('paint').find(({ name }) => name === 'first-paint')
  return fp ? Math.round(fp.startTime) : 0
}

function getFirstContentfulPaint() {
  if (typeof PerformancePaintTiming === 'undefined') return 0
  const fcp = perf.getEntriesByType('paint').find(({ name }) => name === 'first-contentful-paint')
  return fcp ? Math.round(fcp.startTime) : 0
}

function getOnLoad() {
  if (!perf || !perf.timing) return 0
  return perf.timing.loadEventEnd - perf.timing.fetchStart
}

function getDomContentLoaded() {
  if (!perf || !perf.timing) return 0
  return perf.timing.domContentLoadedEventEnd - perf.timing.fetchStart
}

function getNow() {
  if (!perf || !perf.now) return 0
  return Math.round(perf.now())
}

function getMarks() {
  if (!perf || !perf.getEntriesByType) return {}
  return perf.getEntriesByType('mark').reduce((memo, entry) => {
    memo[entry.name] = Math.round(entry.startTime)
    return memo
  }, {})
}

function getMeasures() {
  if (!perf || !perf.getEntriesByType) return {}
  return perf.getEntriesByType('measure').reduce((memo, entry) => {
    memo[entry.name] = Math.round(entry.duration)
    return memo
  }, {})
}

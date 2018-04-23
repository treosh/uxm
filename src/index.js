const perf = typeof window !== 'undefined' ? window.performance : null

// get all metrics

export function uxm(opts = {}) {
  let result = {
    deviceType: getDeviceType(),
    effectiveConnectionType: getEffectiveConnectionType(),
    firstPaint: getFirstPaint(),
    firstContentfulPaint: getFirstContentfulPaint(),
    domContentLoaded: getDomContentLoaded(),
    onLoad: getOnLoad()
  }
  if (opts.url || opts.all) result.url = getUrl()
  if (opts.userAgent || opts.all) result.userAgent = getUserAgent()
  if (opts.deviceMemory || opts.all) result.deviceMemory = getDeviceMemory()
  if (opts.userTiming || opts.all) result.userTiming = getUserTiming()
  if (opts.longTasks || opts.all) result.longTasks = getLongTasks()
  if (opts.resources || opts.all) result.resources = getResources()
  if (result.onLoad < 0) return new Promise(resolve => setTimeout(resolve, 250)).then(() => uxm(opts))
  return Promise.resolve(result)
}

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

// default metrics

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

// get device type
// based on https://github.com/matthewhudson/current-device/blob/master/src/index.js
// returns “phone”, “tablet”, or “desktop”

export function getDeviceType(ua) {
  ua = (ua || getUserAgent()).toLowerCase()
  const find = str => ua.indexOf(str) !== -1

  // windows
  const isWindows = find('windows')
  const isWindowsPhone = isWindows && find('phone')
  const isWindowsTablet = isWindows && (find('touch') && !isWindowsPhone)

  // ios
  const isIphone = !isWindows && find('iphone')
  const isIpod = find('ipod')
  const isIpad = find('ipad')

  // android
  const isAndroid = !isWindows && find('android')
  const isAndroidPhone = isAndroid && find('mobile')
  const isAndroidTablet = isAndroid && !find('mobile')

  // detect device
  const isPhone = isAndroidPhone || isIphone || isIpod || isWindowsPhone
  const isTablet = isIpad || isAndroidTablet || isWindowsTablet
  return isPhone ? 'phone' : isTablet ? 'tablet' : 'desktop'
}

// extra metrics

export function getUrl() {
  return window.location.href
}

export function getUserAgent() {
  return window.navigator.userAgent
}

export function getDeviceMemory() {
  const deviceMemory = typeof navigator !== 'undefined' ? navigator.deviceMemory : undefined
  if (deviceMemory === undefined) return null
  return deviceMemory > 1 ? 'full' : 'lite'
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
  return perf
    .getEntriesByType('navigation')
    .concat(perf.getEntriesByType('resource'))
    .map(entry => {
      return {
        url: entry.name,
        type: entry.initiatorType,
        size: entry.transferSize,
        startTime: Math.round(entry.startTime),
        duration: Math.round(entry.duration)
      }
    })
}

export function getLongTasks() {
  if (typeof window.__lt === 'undefined') return null
  return window.__lt.e.map(longTask => ({
    startTime: Math.round(longTask.startTime),
    duration: Math.round(longTask.duration)
  }))
}

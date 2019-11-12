const perf = typeof window !== 'undefined' ? window.performance : null

/**
 * @typedef {'phone' | 'tablet' | 'desktop' | null} DeviceType
 * @typedef {'full' | 'lite' | null} DeviceMemory
 * @typedef {'slow-2g' | '2g' | '3g' | '4g' | null} EffectiveConnectionType
 *
 * @typedef {object} UserTiming
 * @prop {'mark' | 'measure'} type
 * @prop {string} name
 * @prop {number} startTime
 * @prop {number} [duration]
 *
 * @typedef {object} Resource
 * @prop {string} url
 * @prop {string} type
 * @prop {number} size
 * @prop {number} startTime
 * @prop {number} duration
 *
 * @typedef {object} LongTask
 * @prop {number} startTime
 * @prop {number} duration
 *
 * @typedef {object} UxmResult
 * @prop {DeviceType} deviceType
 * @prop {EffectiveConnectionType} effectiveConnectionType
 * @prop {number | null} timeToFirstByte
 * @prop {number | null} firstPaint
 * @prop {number | null} firstContentfulPaint
 * @prop {number | null} domContentLoaded
 * @prop {number | null} onLoad
 * @prop {string} [url]
 * @prop {string} [userAgent]
 * @prop {DeviceMemory | null} [deviceMemory]
 * @prop {UserTiming[] | null} [userTiming]
 * @prop {LongTask[] | null} [longTasks]
 * @prop {Resource[] | null} [resources]
 */

/**
 * Get all metrics.
 *
 * @param {{ all?: boolean, url?: boolean, userAgent?: boolean, deviceMemory?: boolean, userTiming?: boolean, longTasks?: boolean, resources?: boolean }} [opts]
 * @return {Promise<UxmResult>}
 */

export function uxm(opts = {}) {
  /** @type {UxmResult} */
  let result = {
    deviceType: getDeviceType(),
    effectiveConnectionType: getEffectiveConnectionType(),
    timeToFirstByte: getTimeToFirstByte(),
    firstPaint: getFirstPaint(),
    firstContentfulPaint: getFirstContentfulPaint(),
    domContentLoaded: getDomContentLoaded(),
    onLoad: getOnLoad()
  }
  if (!result.onLoad) return new Promise(resolve => setTimeout(resolve, 250)).then(() => uxm(opts))
  if (opts.url || opts.all) result.url = getUrl()
  if (opts.userAgent || opts.all) result.userAgent = getUserAgent()
  if (opts.deviceMemory || opts.all) result.deviceMemory = getDeviceMemory()
  if (opts.userTiming || opts.all) result.userTiming = getUserTiming()
  if (opts.longTasks || opts.all) result.longTasks = getLongTasks()
  if (opts.resources || opts.all) result.resources = getResources()
  return Promise.resolve(result)
}

/**
 * Create a custom performance mark with `markName` name.
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/mark
 *
 * @param {string} markName
 * @return {PerformanceMark | null}
 */

export function mark(markName) {
  if (!perf || !perf.mark) return null
  return perf.mark(markName)
}

/**
 * Create performance measurement `measureName` between marks, the navigation start time, or `startMarkName`.
 * https://developer.mozilla.org/en-US/docs/Web/API/Performance/measure
 *
 * @param {string} measureName
 * @param {string} [startMarkName]
 * @return {PerformanceMeasure | null}
 */

export function measure(measureName, startMarkName) {
  if (!perf || !perf.measure) return null
  try {
    return perf.measure(measureName, startMarkName)
  } catch (err) {
    console.error(err)
    return null
  }
}

/**
 * Get effective connection type.
 * https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 *
 * @return {EffectiveConnectionType}
 */

export function getEffectiveConnectionType() {
  const conn =
    typeof navigator !== 'undefined'
      ? navigator.connection || navigator.mozConnection || navigator.webkitConnection
      : null
  return conn ? conn.effectiveType : null
}

/**
 * Get `first-paint` mark.
 *
 * @return {number | null}
 */

export function getFirstPaint() {
  if (!perf || typeof window.PerformancePaintTiming === 'undefined') return null
  // .find is available, because PerformancePaintTiming ensures modern browser support
  const fp = perf.getEntriesByType('paint').find(({ name }) => name === 'first-paint')
  return fp ? Math.round(fp.startTime) : null
}

/**
 * Get `first-contentful-paint` mark.
 *
 * @return {number | null}
 */

export function getFirstContentfulPaint() {
  if (!perf || typeof window.PerformancePaintTiming === 'undefined') return null
  const fcp = perf.getEntriesByType('paint').find(({ name }) => name === 'first-contentful-paint')
  return fcp ? Math.round(fcp.startTime) : null
}

/**
 * Get server response timestamp.
 *
 * @return {number | null}
 */

export function getTimeToFirstByte() {
  if (!perf) return null
  const navEntries = perf.getEntriesByType('navigation')
  return navEntries && navEntries[0] ? Math.round(navEntries[0].responseStart) : null
}

/**
 * Get `DomContentLoaded` event timestamp.
 *
 * @return {number | null}
 */

export function getDomContentLoaded() {
  if (!perf) return null
  const navEntries = perf.getEntriesByType('navigation')
  return navEntries && navEntries[0] ? Math.round(navEntries[0].domContentLoadedEventEnd) : null
}

/**
 * Get `load` event timestamp.
 *
 * @return {number | null}
 */

export function getOnLoad() {
  if (!perf) return null
  const navEntries = perf.getEntriesByType('navigation')
  return navEntries && navEntries[0] ? Math.round(navEntries[0].loadEventEnd) : null
}

/**
 * Get device type.
 * based on https://github.com/matthewhudson/current-device/blob/master/src/index.js
 *
 * @param {string} [ua]
 * @return {DeviceType}
 */

export function getDeviceType(ua = getUserAgent()) {
  ua = ua.toLowerCase()
  const find = /** @param {string} str */ str => ua.indexOf(str) !== -1

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

/**
 * Get current url.
 *
 * @return {String}
 */

export function getUrl() {
  return window.location.href
}

/**
 * Get user-agent.
 *
 * @return {String}
 */

export function getUserAgent() {
  return window.navigator.userAgent
}

/**
 * Get effective device memory.
 *
 * @return {DeviceMemory | null}
 */

export function getDeviceMemory() {
  const deviceMemory = typeof navigator !== 'undefined' ? navigator.deviceMemory : undefined
  if (deviceMemory === undefined) return null
  return deviceMemory > 1 ? 'full' : 'lite'
}

/**
 * Get all user timings.
 *
 * @return {UserTiming[] | null}
 */

export function getUserTiming() {
  if (!perf || typeof PerformanceMark === 'undefined') return null
  /** @type {UserTiming[]} */
  const marks = perf.getEntriesByType('mark').map(mark => {
    return { type: 'mark', name: mark.name, startTime: Math.round(mark.startTime) }
  })
  /** @type {UserTiming[]} */
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

/**
 * Get resources.
 *
 * @return {Resource[] | null}
 */

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

/**
 * Get collected long tasks.
 *
 * @return {LongTask[] | null}
 */

export function getLongTasks() {
  if (typeof window.__lt === 'undefined') return null
  return window.__lt.e.map(
    /** @param {object} longTask */ longTask => ({
      startTime: Math.round(longTask.startTime),
      duration: Math.round(longTask.duration)
    })
  )
}

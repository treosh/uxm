import { round, debug, perf, raf } from './utils'

/**
 * Get Time to First Byte.
 * Learn more: https://web.dev/custom-metrics/#navigation-timing-api
 *
 * @return {Promise<number | null>}
 */

export function getTimeToFirstByte() {
  return getNavigation().then(nav => {
    if (!nav && perf && perf.timing && perf.timing.responseStart) {
      debug('no navigation event, use timing')
      return round(perf.timing.responseStart - perf.timing.navigationStart)
    }
    return round(nav.responseStart)
  })
}

/**
 * Get server timing.
 * Learn more: https://web.dev/custom-metrics/#server-timing-api
 *
 * @return {Promise<object[] | null>}
 */

export function getServerTiming() {
  return getNavigation().then(nav => (nav ? nav.serverTiming || [] : null))
}

/**
 * Get `DOMContentLoaded` event.
 * Learn more: https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event
 *
 * @param {boolean} [isAfterPromise]
 * @return {Promise<number | null>}
 */

export function getDomContentLoaded(isAfterPromise = false) {
  return getNavigation().then(nav => {
    if (!nav && perf && perf.timing && perf.timing.domContentLoadedEventEnd) {
      debug('no navigation event, use timing')
      return round(perf.timing.domContentLoadedEventEnd - perf.timing.navigationStart)
    }
    if (nav.domContentLoadedEventEnd) return round(nav.domContentLoadedEventEnd)
    if (isAfterPromise) return null
    return new Promise(resolve => {
      const dclListener = () => {
        debug('DCL listener')
        removeEventListener('DOMContentLoaded', dclListener, true)
        raf(() => getDomContentLoaded(true).then(resolve))
      }
      addEventListener('DOMContentLoaded', dclListener, true)
    })
  })
}

/**
 * Get `loadEventEnd` event.
 * Learn more: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/loadEventEnd
 *
 * @param {boolean} [isAfterPromise]
 * @return {Promise<number | null>}
 */

export function getOnLoad(isAfterPromise = false) {
  return getNavigation().then(nav => {
    if (!nav && perf && perf.timing && perf.timing.loadEventEnd) {
      debug('no navigation event, use timing')
      return round(perf.timing.loadEventEnd - perf.timing.navigationStart)
    }
    if (nav.loadEventEnd) return round(nav.loadEventEnd)
    if (isAfterPromise) return null
    return new Promise(resolve => {
      const loadListener = () => {
        debug('load listener')
        removeEventListener('load', loadListener, true)
        raf(() => getOnLoad(true).then(resolve))
      }
      addEventListener('load', loadListener, true)
    })
  })
}

export function getNavigation() {
  return new Promise(resolve => {
    if (!perf) return resolve(null)
    resolve((perf.getEntriesByType('navigation') || [null])[0])
  })
}

import { round, debug, perf, raf } from './utils'

/**
 * Get Time to First Byte.
 * Learn more: https://web.dev/custom-metrics/#navigation-timing-api
 *
 * @return {Promise<number | null>}
 */

export function getTimeToFirstByte() {
  return getNavigation().then(nav => (nav ? round(nav.responseStart) : null))
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
    if (!nav) return null
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
    if (!nav) return null
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

import { round } from './utils'

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
 * @return {Promise<number | null>}
 */

export function getDomContentLoaded() {
  return getNavigation().then(nav => {
    if (!nav) return null
    if (nav.domContentLoadedEventEnd) return round(nav.domContentLoadedEventEnd)
    return new Promise(resolve => {
      const dclListener = () => {
        removeEventListener('DOMContentLoaded', dclListener, true)
        getDomContentLoaded().then(resolve)
      }
      addEventListener('DOMContentLoaded', dclListener, true)
    })
  })
}

/**
 * Get `loadEventEnd` event.
 * Learn more: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/loadEventEnd
 *
 * @return {Promise<number | null>}
 */

export function getOnLoad() {
  return getNavigation().then(nav => {
    if (!nav) return null
    if (nav.loadEventEnd) return round(nav.loadEventEnd)
    return new Promise(resolve => {
      const loadListener = () => {
        removeEventListener('load', loadListener, true)
        getOnLoad().then(resolve)
      }
      addEventListener('load', loadListener, true)
    })
  })
}

export function getNavigation() {
  return new Promise(resolve => {
    if (!performance) return resolve(null)
    resolve((performance.getEntriesByType('navigation') || [null])[0])
  })
}

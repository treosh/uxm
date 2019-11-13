import { getEventsByType } from './performance-observer'
import { round } from './utils'

/**
 * Get Time to First Byte.
 * Learn more: https://web.dev/custom-metrics/#navigation-timing-api
 *
 * @return {Promise<number | null>}
 */

export function getTimeToFirstByte() {
  return getEventsByType('navigation').then(([nav]) => (nav ? round(nav.responseStart) : null))
}

/**
 * Get server timing.
 * Learn more: https://web.dev/custom-metrics/#server-timing-api
 *
 * @return {Promise<object[] | null>}
 */

export function getServerTiming() {
  return getEventsByType('navigation').then(([nav]) => (nav ? nav.serverTiming || [] : null))
}

/**
 * Get `DOMContentLoaded` event.
 * Learn more: https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event
 *
 * @return {Promise<number | null>}
 */

export function getDomContentLoaded() {
  return getEventsByType('navigation').then(([nav]) => {
    if (!nav) return null
    if (nav.domContentLoadedEventEnd) return round(nav.domContentLoadedEventEnd)
    return new Promise(resolve => {
      const dclListener = () => {
        getDomContentLoaded().then(val => resolve(val))
        window.removeEventListener('DOMContentLoaded', dclListener, true)
      }
      window.addEventListener('DOMContentLoaded', dclListener, true)
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
  return getEventsByType('navigation').then(([nav]) => {
    if (!nav) return null
    if (nav.loadEventEnd) return round(nav.loadEventEnd)
    return new Promise(resolve => {
      const loadListener = () => {
        getOnLoad().then(val => resolve(val))
        window.removeEventListener('load', loadListener, true)
      }
      window.addEventListener('load', loadListener, true)
    })
  })
}

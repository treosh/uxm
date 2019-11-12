import { getEventsByType } from './performance-observer'

/**
 * Get Time to First Byte.
 * Learn more: https://web.dev/custom-metrics/#navigation-timing-api
 *
 * @return {Promise<number | null>}
 */

export function getTimeToFirstByte() {
  return getEventsByType('navigation').then(([nav]) => (nav ? Math.round(nav.responseStart) : null))
}

/**
 * Get server timing.
 * Learn more: https://web.dev/custom-metrics/#server-timing-api
 *
 * @return {Promise<object | null>}
 */

export function getServerTiming() {
  return getEventsByType('navigation').then(([nav]) => (nav ? nav.serverTiming || null : null))
}

/**
 * Get `DOMContentLoaded` event.
 * Learn more: https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event
 *
 * @return {Promise<object | null>}
 */

export function getDomContentLoaded() {
  return getEventsByType('navigation').then(([nav]) => (nav ? Math.round(nav.domContentLoadedEventEnd) : null))
}

/**
 * Get `DOMContentLoaded` event.
 * Learn more: https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event
 *
 * @return {Promise<object | null>}
 */

export function getOnLoad() {
  return getEventsByType('navigation').then(([nav]) => (nav ? Math.round(nav.loadEventEnd) : null))
}

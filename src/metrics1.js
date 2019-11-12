import roundTo from 'round-to'
import { getEventsByType } from './performance-observer'

/** @param {number} val */
const round = (val, precision = 0) => roundTo(val, precision)

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
 * @return {Promise<object | null>}
 */

export function getServerTiming() {
  return getEventsByType('navigation').then(([nav]) => (nav ? nav.serverTiming : null))
}

/**
 * Get First Contentful Paint.
 * Learn more: https://web.dev/fcp/
 *
 * @return {Promise<number | null>}
 */

export function getFirstContentfulPaint() {
  return getEventsByType('paint').then(paintEvents => {
    if (!paintEvents.length) return null
    const fcpEvent = paintEvents.find(e => e.name === 'first-contentful-paint')
    return fcpEvent ? round(fcpEvent.startTime) : null
  })
}

/**
 * Get Largest Contentful Paint.
 * Learn more: https://web.dev/lcp/
 *
 * @return {Promise<number | null>}
 */

export function getLargestContentfulPaint() {
  return getEventsByType('largest-contentful-paint').then(lcpEvents => {
    return lcpEvents.length ? round(lcpEvents[lcpEvents.length - 1].startTime) : null
  })
}

import { createPerformanceObserver } from './performance-observer'

/**
 * Get First Contentful Paint. Learn more: https://web.dev/fcp/
 * @return {Promise<number | null>}
 */

export function getFirstContentfulPaint() {
  return new Promise(resolve => {
    if (fcpObserver === null) return resolve(fcp)
    fcpCallbacks.push(resolve)
  })
}

/** @type {number | null} */
let fcp = null
/** @type {function[]} */
let fcpCallbacks = []
let fcpObserver = createPerformanceObserver('paint', paintEvents => {
  const fcpEvent = paintEvents.find(e => e.name === 'first-contentful-paint')
  if (fcpEvent) {
    fcp = Math.round(fcpEvent.startTime)
    if (fcpObserver) fcpObserver.disconnect()
    fcpObserver = null
    fcpCallbacks.forEach(cb => cb(fcp))
    fcpCallbacks = []
  }
})

/**
 * Get First Input Delay. Learn more: https://web.dev/fid/
 * @return {Promise<number | null>}
 */

export function getFirstInputDelay() {
  return new Promise(resolve => {
    if (fidObserver === null) return resolve(fid)
    fidCallbacks.push(resolve)
  })
}

/** @type {number | null} */
let fid = null
/** @type {function[]} */
let fidCallbacks = []
let fidObserver = createPerformanceObserver('first-input', ([fidEvent]) => {
  fid = Math.round(fidEvent.processingStart - fidEvent.startTime)
  if (fidObserver) fidObserver.disconnect()
  fidObserver = null
  fidCallbacks.forEach(cb => cb(fid))
  fidCallbacks = []
  // emit lcp after the first interaction
  emitLcpEvents()
})

/**
 * Get Largest Contentful Paint. Learn more: https://web.dev/lcp/
 * @return {Promise<number | null>}
 */

export function getLargestContentfulPaint() {
  return new Promise(resolve => {
    if (lcpObserver === null) return resolve(lcp)
    lcpCallbacks.push(resolve)
  })
}

/** @type {number | null} */
let lcp = null
/** @type {function[]} */
let lcpCallbacks = []
let lcpObserver = createPerformanceObserver('largest-contentful-paint', lcpEvents => {
  const lastLcpEvent = lcpEvents[lcpEvents.length - 1]
  lcp = Math.round(lastLcpEvent.renderTime || lastLcpEvent.loadTime)
})
function emitLcpEvents() {
  if (lcpObserver) {
    lcpObserver.disconnect()
    lcpObserver = null
    removeEventListener('visibilitychange', lcpVisibilityChangeListener, true)
    lcpCallbacks.forEach(cb => cb(lcp))
    lcpCallbacks = []
  }
}
function lcpVisibilityChangeListener() {
  if (document.visibilityState === 'hidden') emitLcpEvents()
}
document.addEventListener('visibilitychange', lcpVisibilityChangeListener, true)

/**
 * Get Cimmulative Layout Shift. Learn more: https://web.dev/cls/
 * @return {Promise<number | null>}
 */

export const getCumulativeLayoutShift = () => {
  return new Promise(resolve => {
    if (clsObserver === null) return resolve(cls)
    clsCallbacks.push(resolve)
  })
}

/** @type {number} */
let cls = 0
/** @type {function[]} */
let clsCallbacks = []
let clsObserver = createPerformanceObserver('layout-shift', lsEvents => {
  lsEvents.forEach(lsEvent => {
    // Only count layout shifts without recent user input.
    if (!lsEvent.hadRecentInput) cls += lsEvent.value
  })
})
function clsVisibilityChangeListener() {
  if (clsObserver && document.visibilityState === 'hidden') {
    // Force any pending records to be dispatched.
    clsObserver.takeRecords()
    clsObserver.disconnect()
    clsObserver = null
    removeEventListener('visibilitychange', clsVisibilityChangeListener, true)
    clsCallbacks.forEach(cb => cb(cls))
    clsCallbacks = []
  }
}
document.addEventListener('visibilitychange', clsVisibilityChangeListener, true)

import mitt from 'mitt'
import { createPerformanceObserver } from './performance-observer'
import { round } from './utils'

const FCP = 'first-contentful-paint'
const FID = 'first-input-delay'
const LCP = 'largest-contentful-paint'
const CLS = 'cumulative-layout-shift'

/** @typedef {'first-contentful-paint' | 'first-input-delay' | 'largest-contentful-paint' | 'cumulative-layout-shift'} MetricType */
/** @typedef {(metric: number | null) => any} PerformanceMetricCallback */

export const metrics = {
  /**
   * Subscribe on the `metric`.
   *
   * @param {string} metricType
   * @param {PerformanceMetricCallback} cb
   */
  on(metricType, cb) {
    const metric = normalizeMetricType(metricType)
    if (metric === FCP) getValueOrCreateObserver(FCP, initFcpObserver, cb)
    else if (metric === FID) getValueOrCreateObserver(FID, initFidObserver, cb)
    else if (metric === LCP) getValueOrCreateObserver(LCP, initLcpObserver, cb)
    else if (metric === CLS) getValueOrCreateObserver(CLS, initClsObserver, cb)
    else throw new Error(`Invalid metric type: ${metricType}`)
    return metrics
  },

  /** @type {import('mitt').Emitter | null} */
  _emitter: null,
  /** @type {Object<string,number>} */
  _values: {},
  /** @type {Object<string,true>} */
  _observers: {}
}

/** Get First Contentful Paint. Learn more: https://web.dev/fcp/ */
export const getFirstContentfulPaint = () => getMetricValue(FCP, initFcpObserver)
/** Get First Input Delay. Learn more: https://web.dev/fid/ */
export const getFirstInputDelay = () => getMetricValue(FID, initFidObserver)
/** Get Largest Contentful Paint. Learn more: https://web.dev/lcp/ */
export const getLargestContentfulPaint = () => getMetricValue(LCP, initLcpObserver)
/** Get Cimmulative Layout Shift. Learn more: https://web.dev/cls/ */
export const getCumulativeLayoutShift = () => getMetricValue(CLS, initClsObserver)

/** @param {MetricType} metricName @param {Function} observer @return {Promise<number | null>} */
function getMetricValue(metricName, observer) {
  return new Promise(resolve => getValueOrCreateObserver(metricName, observer, resolve))
}

/** @param {MetricType} metricName @param {Function} observer @param {PerformanceMetricCallback} cb */
function getValueOrCreateObserver(metricName, observer, cb) {
  if (metrics._values[metricName]) return cb(metrics._values[metricName]) // buffered by default
  if (!metrics._emitter) metrics._emitter = mitt()
  metrics._emitter.on(metricName, cb)
  if (!metrics._observers[metricName]) {
    observer()
    metrics._observers[metricName] = true
  }
}

function initFcpObserver() {
  let fcpObserver = createPerformanceObserver(FCP, paintEvents => {
    const fcpEvent = paintEvents.find(e => e.name === 'first-contentful-paint')
    if (fcpEvent && fcpObserver) {
      metrics._values[FCP] = round(fcpEvent.startTime)
      fcpObserver.disconnect()
      fcpObserver = null
      if (metrics._emitter) metrics._emitter.emit(FCP, metrics._values[FCP])
    }
  })
}

function initFidObserver() {
  let fidObserver = createPerformanceObserver(FID, ([fidEvent]) => {
    if (fidObserver) {
      metrics._values[FID] = round(fidEvent.processingStart - fidEvent.startTime)
      fidObserver.disconnect()
      fidObserver = null
      if (metrics._emitter) metrics._emitter.emit(FID, metrics._values[FID])
    }
  })
}

function initLcpObserver() {
  let lcp = 0
  let lcpObserver = createPerformanceObserver(LCP, lcpEvents => {
    const lastLcpEvent = lcpEvents[lcpEvents.length - 1]
    lcp = round(lastLcpEvent.renderTime || lastLcpEvent.loadTime)
  })
  // force emit after the first interactiion
  let fidObserver = createPerformanceObserver(FID, () => {
    if (fidObserver) {
      fidObserver.disconnect()
      fidObserver = null
      emitLcpEvent()
    }
  })
  function emitLcpEvent() {
    if (lcpObserver) {
      lcpObserver.takeRecords()
      lcpObserver.disconnect()
      lcpObserver = null
      metrics._values[LCP] = lcp
      document.removeEventListener('visibilitychange', emitLcpEvent, true)
      if (metrics._emitter) metrics._emitter.emit(LCP, metrics._values[LCP])
    }
  }
  document.addEventListener('visibilitychange', emitLcpEvent, true)
}

function initClsObserver() {
  let cls = 0
  let clsObserver = createPerformanceObserver('layout-shift', lsEvents => {
    lsEvents.forEach(lsEvent => {
      // Only count layout shifts without recent user input.
      // collect percentage value
      if (!lsEvent.hadRecentInput) {
        cls = round(cls + 100 * lsEvent.value, 3)
      }
    })
  })
  function clsVisibilityChangeListener() {
    if (clsObserver) {
      // Force any pending records to be dispatched.
      clsObserver.takeRecords()
      clsObserver.disconnect()
      clsObserver = null
      metrics._values[CLS] = cls
      document.removeEventListener('visibilitychange', clsVisibilityChangeListener, true)
      if (metrics._emitter) metrics._emitter.emit(CLS, metrics._values[CLS])
    }
  }
  document.addEventListener('visibilitychange', clsVisibilityChangeListener, true)
}

/** @param {string} metricType @return {string} */
function normalizeMetricType(metricType) {
  const metric = metricType.toLowerCase()
  if (metric === 'fcp') return FCP
  else if (metric === 'fid') return FID
  else if (metric === 'lcp') return LCP
  else if (metric === 'cls') return CLS
  else return metric
}

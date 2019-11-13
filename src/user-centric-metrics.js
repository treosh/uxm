import mitt from 'mitt'
import { createPerformanceObserver } from './performance-observer'

/** @typedef {'first-contentful-paint' | 'first-input-delay' | 'largest-contentful-paint' | 'cumulative-layout-shift'} MetricType */
// constants
const FCP = 'first-contentful-paint'
const FID = 'first-input-delay'
const LCP = 'largest-contentful-paint'
const CLS = 'cumulative-layout-shift'

// track events
const emitter = mitt()
/** @type {Object<string,number>} */
const values = {}
/** @type {Object<string,boolean>} */
const observers = {}

export const metrics = {
  /**
   * Subscribe on the `metric`.
   *
   * @param {string} metricType
   * @param {PerformanceMetricCallback} cb
   */
  on(metricType, cb) {
    switch (normalizeMetricType(metricType)) {
      case FCP:
        getValueOrCreateObserver(FCP, initFcpObserver, cb)
      case FID:
        getValueOrCreateObserver(FID, initFidAndLcpObserver, cb)
      case LCP:
        getValueOrCreateObserver(LCP, initFidAndLcpObserver, cb)
      case CLS:
        getValueOrCreateObserver(CLS, initClsObserver, cb)
      default:
        throw new Error(`Invalid metric type: ${metricType}`)
    }
  },

  /**
   * Unsubscribe `metric` listener.
   *
   * @param {MetricType} metricType
   * @param {PerformanceMetricCallback} cb
   */
  off(metricType, cb) {
    emitter.off(metricType, cb)
  }
}

/** Get First Contentful Paint. Learn more: https://web.dev/fcp/ */
export const getFirstContentfulPaint = () => getMetricValue(FCP, initFcpObserver)
/** Get First Input Delay. Learn more: https://web.dev/fid/ */
export const getFirstInputDelay = () => getMetricValue(FID, initFidAndLcpObserver)
/** Get Largest Contentful Paint. Learn more: https://web.dev/lcp/ */
export const getLargestContentfulPaint = () => getMetricValue(LCP, initFidAndLcpObserver)
/** Get Cimmulative Layout Shift. Learn more: https://web.dev/cls/ */
export const getCumulativeLayoutShift = () => getMetricValue(CLS, initClsObserver)

/** @param {MetricType} metricName @param {Function} observer @return {Promise<number | null>} */
function getMetricValue(metricName, observer) {
  return new Promise(resolve => getValueOrCreateObserver(metricName, observer, resolve))
}

/** @param {MetricType} metricName @param {Function} observer @param {PerformanceMetricCallback} cb */
function getValueOrCreateObserver(metricName, observer, cb) {
  if (values[metricName]) return cb(values[metricName])
  emitter.on(metricName, cb)
  if (!observers[metricName]) {
    observer()
    observers[metricName] = true
  }
}

function initFcpObserver() {
  let fcpObserver = createPerformanceObserver('paint', paintEvents => {
    const fcpEvent = paintEvents.find(e => e.name === 'first-contentful-paint')
    if (fcpEvent) {
      values[FCP] = Math.round(fcpEvent.startTime)
      if (fcpObserver) fcpObserver.disconnect()
      fcpObserver = null
      emitter.emit(FCP, values[FCP])
    }
  })
}

function initFidAndLcpObserver() {
  let fidObserver = createPerformanceObserver('first-input', ([fidEvent]) => {
    values[FID] = Math.round(fidEvent.processingStart - fidEvent.startTime)
    if (fidObserver) fidObserver.disconnect()
    fidObserver = null
    emitter.emit(FID, values[FID])
    emitLcpEvents() // emit lcp after the first interaction
  })
  let lcp = 0
  let lcpObserver = createPerformanceObserver('largest-contentful-paint', lcpEvents => {
    const lastLcpEvent = lcpEvents[lcpEvents.length - 1]
    lcp = Math.round(lastLcpEvent.renderTime || lastLcpEvent.loadTime)
  })
  function emitLcpEvents() {
    if (lcpObserver) {
      lcpObserver.disconnect()
      lcpObserver = null
      values[LCP] = lcp
      removeEventListener('visibilitychange', lcpVisibilityChangeListener, true)
      emitter.emit(LCP, values[LCP])
    }
  }
  function lcpVisibilityChangeListener() {
    if (document.visibilityState === 'hidden') emitLcpEvents()
  }
  document.addEventListener('visibilitychange', lcpVisibilityChangeListener, true)
}

function initClsObserver() {
  let cls = 0
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
      values[CLS] = cls
      removeEventListener('visibilitychange', clsVisibilityChangeListener, true)
      emitter.emit(CLS, values[CLS])
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

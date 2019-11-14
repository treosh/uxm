import mitt from 'mitt'
import { createPerformanceObserver } from './performance-observer'
import { round, debug } from './utils'

const FCP = 'first-contentful-paint'
const FID = 'first-input-delay'
const LCP = 'largest-contentful-paint'
const CLS = 'cumulative-layout-shift'

/** @typedef {'first-contentful-paint' | 'first-input-delay' | 'largest-contentful-paint' | 'cumulative-layout-shift'} MetricType */
/** @typedef {(metric: number | null) => any} PerformanceMetricCallback */

const emitter = mitt()
/** @type {Object<string,number>} */
const values = {}
/** @type {Object<string,true>} */
const observers = {}

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
  }
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
  if (values[metricName]) {
    debug('get buffered metric value: %s=%s', metricName, values[metricName])
    return cb(values[metricName]) // buffered by default
  }
  emitter.on(metricName, cb)
  if (!observers[metricName]) {
    debug('init observer: %s', metricName)
    observer()
    observers[metricName] = true
  }
}

function initFcpObserver() {
  let fcpObserver = createPerformanceObserver(FCP, paintEvents => {
    const fcpEvent = paintEvents.find(e => e.name === 'first-contentful-paint')
    if (fcpEvent && fcpObserver) {
      values[FCP] = round(fcpEvent.startTime)
      fcpObserver.disconnect()
      fcpObserver = null
      debug('capture: %s=%sms', FCP, values[FCP])
      if (emitter) emitter.emit(FCP, values[FCP])
    }
  })
}

function initFidObserver() {
  let fidObserver = createPerformanceObserver(FID, ([fidEvent]) => {
    if (fidObserver) {
      values[FID] = round(fidEvent.processingStart - fidEvent.startTime)
      fidObserver.disconnect()
      fidObserver = null
      debug('capture: %s=%sms', FID, values[FID])
      if (emitter) emitter.emit(FID, values[FID])
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
      debug('force LCP after the first input')
      emitLcpEvent()
    }
  })
  function emitLcpEvent() {
    if (lcpObserver) {
      lcpObserver.takeRecords()
      lcpObserver.disconnect()
      lcpObserver = null
      values[LCP] = lcp
      document.removeEventListener('visibilitychange', lcpVisibilityChangeListener, true)
      debug('capture: %s=%sms', LCP, values[LCP])
      if (emitter) emitter.emit(LCP, values[LCP])
    }
  }
  function lcpVisibilityChangeListener() {
    debug('visibilitychange: LCP')
    emitLcpEvent()
  }
  document.addEventListener('visibilitychange', lcpVisibilityChangeListener, true)
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
    debug('visibilitychange: LCS')
    if (clsObserver) {
      // Force any pending records to be dispatched.
      clsObserver.takeRecords()
      clsObserver.disconnect()
      clsObserver = null
      values[CLS] = cls
      debug('capture: %s=%s%', CLS, values[CLS])
      document.removeEventListener('visibilitychange', clsVisibilityChangeListener, true)
      if (emitter) emitter.emit(CLS, values[CLS])
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

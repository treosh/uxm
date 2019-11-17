import mitt from 'mitt'
import { createPerformanceObserver } from './performance-observer'
import { round, debug } from './utils'

const FCP = 'first-contentful-paint'
const FID = 'first-input-delay'
const LCP = 'largest-contentful-paint'
const CLS = 'cumulative-layout-shift'
const visibilityChange = 'visibilitychange'

/** @typedef {'first-contentful-paint' | 'first-input-delay' | 'largest-contentful-paint' | 'cumulative-layout-shift'} StrictMetricType */
/** @typedef {StrictMetricType | 'fcp' | 'lcp' | 'fid' | 'cls'} MetricType */
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
   * @param {MetricType} metricType
   * @param {PerformanceMetricCallback} cb
   */
  on(metricType, cb) {
    const metric = normalizeMetricType(metricType)
    if (metric === FCP) getValueOrCreateObserver(FCP, initFcpObserver, cb)
    else if (metric === FID) getValueOrCreateObserver(FID, initFidObserver, cb)
    else if (metric === LCP) getValueOrCreateObserver(LCP, initLcpObserver, cb)
    else if (metric === CLS) getValueOrCreateObserver(CLS, initClsObserver, cb)
    else throw new Error(`Invalid metric: ${metricType}`)
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

/** @param {StrictMetricType} metricName @param {Function} observer @return {Promise<number | null>} */
function getMetricValue(metricName, observer) {
  return new Promise(resolve => getValueOrCreateObserver(metricName, observer, resolve))
}

/** @param {StrictMetricType} metricName @param {Function} observer @param {PerformanceMetricCallback} cb */
function getValueOrCreateObserver(metricName, observer, cb) {
  if (values[metricName]) {
    debug('buffered value %s=%s', metricName, values[metricName])
    return cb(values[metricName]) // buffered by default
  }
  emitter.on(metricName, cb)
  if (!observers[metricName]) {
    debug('init observer %s', metricName)
    observer()
    observers[metricName] = true
  }
}

function initFcpObserver() {
  let fcpObserver = createPerformanceObserver('paint', paintEvents => {
    const fcpEvent = paintEvents.find(e => e.name === FCP)
    if (fcpEvent && fcpObserver) {
      values[FCP] = round(fcpEvent.startTime)
      fcpObserver.disconnect()
      debug('capture %s=%sms', FCP, values[FCP])
      emitter.emit(FCP, values[FCP])
    }
  })
}

function initFidObserver() {
  let fidObserver = createPerformanceObserver('first-input', ([fidEvent]) => {
    if (fidObserver) {
      values[FID] = round(fidEvent.processingStart - fidEvent.startTime)
      fidObserver.disconnect()
      debug('capture %s=%sms', FID, values[FID])
      emitter.emit(FID, values[FID])
    }
  })
}

function initLcpObserver() {
  let lcp = 0
  let lcpObserver = createPerformanceObserver('largest-contentful-paint', lcpEvents => {
    const lastLcpEvent = lcpEvents[lcpEvents.length - 1]
    lcp = round(lastLcpEvent.renderTime || lastLcpEvent.loadTime)
  })
  // force emit after the first interactiion
  let fidObserver = createPerformanceObserver('first-input', () => {
    if (fidObserver) {
      fidObserver.disconnect()
      debug('force LCP after FID')
      emitLcpEvent()
    }
  })
  function emitLcpEvent() {
    if (lcpObserver) {
      lcpObserver.takeRecords()
      lcpObserver.disconnect()
      values[LCP] = lcp
      document.removeEventListener(visibilityChange, lcpVisibilityChangeListener, true)
      debug('capture %s=%sms', LCP, values[LCP])
      emitter.emit(LCP, values[LCP])
    }
  }
  function lcpVisibilityChangeListener() {
    debug('%s %s', visibilityChange, LCP)
    emitLcpEvent()
  }
  document.addEventListener(visibilityChange, lcpVisibilityChangeListener, true)
}

function initClsObserver() {
  let cls = 0
  let clsObserver = createPerformanceObserver('layout-shift', lsEvents => {
    lsEvents.forEach(lsEvent => {
      // Only count layout shifts without recent user input.
      // collect percentage value
      if (!lsEvent.hadRecentInput) {
        cls = round(cls + 100 * lsEvent.value, 4)
      }
    })
  })
  function clsVisibilityChangeListener() {
    debug('%s %s', visibilityChange, CLS)
    if (clsObserver) {
      // Force any pending records to be dispatched.
      clsObserver.takeRecords()
      clsObserver.disconnect()
      values[CLS] = cls
      debug('capture %s=%s%', CLS, values[CLS])
      document.removeEventListener(visibilityChange, clsVisibilityChangeListener, true)
      emitter.emit(CLS, values[CLS])
    }
  }
  document.addEventListener(visibilityChange, clsVisibilityChangeListener, true)
}

/** @param {MetricType} metricType @return {string} */
function normalizeMetricType(metricType) {
  const metric = metricType.toLowerCase()
  return metric === 'fcp' ? FCP : metric === 'fid' ? FID : metric === 'lcp' ? LCP : metric === 'cls' ? CLS : metric
}

import mitt from 'mitt'
import { debug } from './utils'
import { config } from './config'

/** @type {Object<string,boolean>} */
const observers = {}
const emitter = mitt()

const PO = typeof PerformanceObserver !== 'undefined' ? window.PerformanceObserver : null
const entryTypes = PO && PO.supportedEntryTypes ? PO.supportedEntryTypes : null
const supportedEntryTypes = entryTypes || [
  'element',
  'first-input',
  'largest-contentful-paint',
  'layout-shift',
  'longtask',
  'mark',
  'measure',
  'navigation',
  'paint',
  'resource'
]
/** @typedef {(events: PerformanceEntry[]) => any} PerformanceEventCallback */

export const performanceEvents = {
  /**
   * Subscribe on the `metric`.
   *
   * @param {string} eventType
   * @param {PerformanceEventCallback} cb
   */
  on(eventType, cb) {
    const type = normalizeEventType(eventType)
    if (!observers[type]) {
      createPerformanceObserver(type, events => {
        if (document.hidden && !config.emitWhenHidden) return
        emitter.emit(eventType, events)
      })
      observers[type] = true
    }
    emitter.on(eventType, cb)
    return performanceEvents
  },

  /**
   * Unsubscribe `metric` listener.
   *
   * @param {string} eventType
   * @param {PerformanceEventCallback} cb
   */
  off(eventType, cb) {
    emitter.off(normalizeEventType(eventType), cb)
  }
}

/**
 * Create performance observer.
 *
 * @param {string} eventType
 * @param {PerformanceEventCallback} cb
 * @return {PerformanceObserver | null}
 */

export function createPerformanceObserver(eventType, cb) {
  if (!PO) return null
  const type = normalizeEventType(eventType)
  const buffered = type !== 'longtask'
  if (supportedEntryTypes.indexOf(type) === -1) throw new Error(`Invalid eventType: ${type}`)
  const po = new PO(list => cb(list.getEntries()))
  po.observe({ type, buffered })
  debug('create performance observer: %s', type)
  return po
}

/**
 * Get buffered events by `type`.
 *
 * @param {string} eventType
 * @return {Promise<PerformanceEntry[]>}
 */

export function getEventsByType(eventType) {
  return new Promise((resolve, reject) => {
    if (!PO) return resolve([])
    const type = normalizeEventType(eventType)
    if (supportedEntryTypes.indexOf(type) === -1) return reject(new Error(`Invalid eventType: ${type}`))
    if (type === 'longtask') return resolve([]) // no buffering for longTasks
    let observer = createPerformanceObserver(
      type,
      /** @param {PerformanceEntry[]} events */ events => {
        if (observer) {
          observer.disconnect()
          observer = null
        }
        clearTimeout(timeout)
        debug('getEventsByType: timeout, resolve with %s event(s)', events.length)
        resolve(events)
      }
    )
    const timeout = setTimeout(() => {
      if (observer) {
        observer.disconnect()
        observer = null
      }
      debug('getEventsByType: timeout, resolve with empty events')
      resolve([])
    }, 250)
  })
}

/**
 * Resolve event type to supported event strings:
 * -
 * - element-timing (because, it's the name of the spec)
 * - long-task (two words should be separated with dash)
 * - first-contentful-paint (that's what user would expect, "paint" is too generic)
 *
 * @param {string} eventType
 * @return {string}
 */

function normalizeEventType(eventType) {
  const type = eventType.toLowerCase()
  if (type === 'element-timing') return 'element'
  else if (type === 'long-task') return 'longtask'
  else if (type === 'fcp' || type === 'first-paint' || type === 'first-contentful-paint') return 'paint'
  else if (type === 'fid' || type === 'first-input-delay') return 'first-input'
  else if (type === 'lcp') return 'largest-contentful-paint'
  else return type
}

import mitt from 'mitt'
import { debug } from './utils'
import { config } from './config'

/** @typedef {(events: PerformanceEntry[]) => any} PerformanceEventCallback */
/** @typedef {'element' | 'first-input' | 'largest-contentful-paint' | 'layout-shift' | 'longtask' | 'mark' | 'measure' | 'navigation' | 'paint' | 'resource'} StrictEventType */
/** @typedef {StrictEventType | 'eliment-timing' | 'long-task'} EventType */

/** @type {Object<string,boolean>} */
const observers = {}
const emitter = mitt()
const PO = typeof PerformanceObserver !== 'undefined' ? PerformanceObserver : null

export const performanceEvents = {
  /**
   * Subscribe on the `metric`.
   *
   * @param {EventType} eventType
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
   * @param {EventType} eventType
   * @param {PerformanceEventCallback} cb
   */
  off(eventType, cb) {
    emitter.off(normalizeEventType(eventType), cb)
  }
}

/**
 * Create performance observer.
 *
 * @param {EventType} eventType
 * @param {PerformanceEventCallback} cb
 * @return {PerformanceObserver | null}
 */

export function createPerformanceObserver(eventType, cb) {
  if (!PO) return null
  const type = normalizeEventType(eventType)
  const buffered = type !== 'longtask'
  if ((PO.supportedEntryTypes || []).indexOf(type) === -1) throw new Error(`Invalid event: ${type}`)
  const po = new PO(list => cb(list.getEntries()))
  po.observe({ type, buffered })
  debug('new PO %s', type)
  return po
}

/**
 * Get buffered events by `type`.
 *
 * @param {EventType} eventType
 * @return {Promise<PerformanceEntry[]>}
 */

export function getEventsByType(eventType) {
  return new Promise(resolve => {
    const type = normalizeEventType(eventType)
    if (!PO || type === 'longtask') return resolve([]) // no buffering for longTasks
    let observer = createPerformanceObserver(type, events => {
      if (observer) observer.disconnect()
      clearTimeout(timeout)
      debug('get %s event(s)', events.length)
      resolve(events)
    })
    const timeout = setTimeout(() => {
      if (observer) observer.disconnect()
      debug('get events timeout')
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
 * @param {EventType} eventType
 * @return {StrictEventType}
 */

function normalizeEventType(eventType) {
  const type = eventType.toLowerCase()
  // @ts-ignore
  return type === 'element-timing' ? 'element' : type === 'long-task' ? 'longtask' : type
}

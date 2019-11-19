import { debug, warn, perf, isUndefined } from './utils'

/** @typedef {(events: PerformanceEntry[]) => any} PerformanceEventCallback */
/** @typedef {'element' | 'first-input' | 'largest-contentful-paint' | 'layout-shift' | 'longtask' | 'mark' | 'measure' | 'navigation' | 'paint' | 'resource'} StrictEventType */
/** @typedef {StrictEventType | 'eliment-timing' | 'long-task' | 'first-contentful-paint'} EventType */

const PO = isUndefined(PerformanceObserver) ? null : PerformanceObserver
const isTypeSupported = PO && PO.supportedEntryTypes
const supportedEventTypes = [
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

/**
 * Create performance observer.
 *
 * @param {EventType} eventType
 * @param {PerformanceEventCallback} callback
 * @param {object} [options]
 * @return {PerformanceObserver}
 */

export function createEventsObserver(eventType, callback, options = {}) {
  const type = normalizeEventType(eventType)
  if (supportedEventTypes.indexOf(type) === -1) throw new Error(`Invalid event: ${type}`)
  if (!PO) return createFakeObserver()
  try {
    const opts = isTypeSupported ? { type, ...options } : { entryTypes: [type], ...options }
    const po = new PO(list => callback(list.getEntries()))
    po.observe(opts)
    debug('new PO(%s, %j)', type, opts)
    return po
  } catch (err) {
    warn(err)
    return createFakeObserver()
  }
}

/**
 * Get buffered events by `type`.
 *
 * @param {EventType} eventType
 * @return {Promise<PerformanceEntry[]>}
 */

export function getEventsByType(eventType) {
  return new Promise((resolve, reject) => {
    const type = normalizeEventType(eventType)
    if (supportedEventTypes.indexOf(type) === -1) return reject(new Error(`Invalid event: ${type}`))
    if (perf && ['mark', 'measure', 'resource', 'navigation'].indexOf(type) >= 0) {
      debug('use sync API')
      return resolve(perf.getEntriesByType(type))
    }
    if (type === 'longtask' || !PO) return resolve([]) // no buffering for longTasks
    const observer = createEventsObserver(
      type,
      events => {
        observer.disconnect()
        clearTimeout(timeout)
        debug('get %s event(s)', events.length)
        resolve(events)
      },
      { buffered: true } // "buffered" flag supported only in Chrome
    )
    const timeout = setTimeout(() => {
      observer.disconnect()
      debug('get events timeout')
      resolve([])
    }, 250)
  })
}

/**
 * Create a fake performance observer interface when the object is not available.
 * The behaviour is similar to Firefox when `type` is not supported.
 *
 * @return {PerformanceObserver}
 */

function createFakeObserver() {
  return {
    observe() {},
    disconnect() {},
    takeRecords() {
      return []
    }
  }
}

/**
 * Resolve event type to supported event strings:
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
  return type === 'element-timing'
    ? 'element'
    : type === 'long-task'
    ? 'longtask'
    : type === 'first-contentful-paint'
    ? 'paint'
    : type
}

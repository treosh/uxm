import { debug, warn, perf } from './utils'

/** @typedef {(events: PerformanceEntry[]) => any} PerformanceEventCallback */
/** @typedef {'element' | 'first-input' | 'largest-contentful-paint' | 'layout-shift' | 'longtask' | 'mark' | 'measure' | 'navigation' | 'paint' | 'resource'} StrictEventType */
/** @typedef {StrictEventType | 'eliment-timing' | 'long-task' | 'first-contentful-paint'} EventType */
/** @typedef {{ type: EventType, buffered?: boolean }} EventOptions */

const PO = typeof PerformanceObserver === 'undefined' ? null : PerformanceObserver
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
 * @param {EventType | EventOptions} eventType
 * @param {PerformanceEventCallback} callback
 * @return {PerformanceObserver}
 */

export function observeEvents(eventType, callback) {
  const opts =
    typeof eventType === 'string'
      ? { type: normalizeEventType(eventType) }
      : { type: normalizeEventType(eventType.type), ...(eventType.buffered && { buffered: eventType.buffered }) }
  if (typeof callback !== 'function') throw new Error('Invalid callback')
  if (!PO) return createFakeObserver()
  try {
    const po = new PO(list => callback(list.getEntries()))
    const finalOpts = isTypeSupported ? opts : { entryTypes: [opts.type] }
    po.observe(finalOpts)
    debug('new PO(%o)', finalOpts)
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
  const type = normalizeEventType(eventType)
  return new Promise(resolve => {
    if (perf && ['mark', 'measure', 'resource', 'navigation'].indexOf(type) >= 0) {
      debug('use sync API')
      return resolve(perf.getEntriesByType(type))
    }
    if (type === 'longtask' || !PO) return resolve([]) // no buffering for longTasks
    const observer = observeEvents({ type, buffered: true }, events => {
      observer.disconnect()
      clearTimeout(timeout)
      debug('got %s event(s)', events.length)
      resolve(events)
    })
    const timeout = setTimeout(() => {
      observer.disconnect()
      debug('got events timeout')
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
  const normalizedType =
    type === 'element-timing'
      ? 'element'
      : type === 'long-task'
      ? 'longtask'
      : type === 'first-contentful-paint'
      ? 'paint'
      : type
  if (supportedEventTypes.indexOf(normalizedType) === -1) throw new Error(`Invalid event: ${eventType}`)
  // @ts-ignore
  return normalizedType
}

/**
 * Create performance observer.
 *
 * @param {string} eventType
 * @param {PerformanceEventCallback} cb
 * @return {PerformanceObserver | null}
 */

export function createPerformanceObserver(eventType, cb) {
  const type = normalizeEventType(eventType)
  const buffered = type !== 'longtask'
  if (typeof PerformanceObserver === 'undefined') return null
  if (supportedEntryTypes.indexOf(type) === -1) throw new Error(`Invalid eventType: ${type}`)
  const po = new PerformanceObserver(list => cb(list.getEntries()))
  po.observe({ type, buffered })
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
    const type = normalizeEventType(eventType)
    if (typeof PerformanceObserver === 'undefined') return resolve([])
    if (supportedEntryTypes.indexOf(type) === -1) return reject(new Error(`Invalid eventType: ${type}`))
    if (type === 'longtask') return resolve([]) // no buffering for longTasks
    const po = createPerformanceObserver(
      type,
      /** @param {PerformanceEntry[]} events */ events => {
        if (po) po.disconnect()
        clearTimeout(timeout)
        resolve(events)
      }
    )
    const timeout = setTimeout(() => {
      if (po) po.disconnect()
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
  else if (type === 'first-paint' || type === 'first-contentful-paint') return 'paint'
  else return type
}

const supportedEntryTypes = PerformanceObserver.supportedEntryTypes || [
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

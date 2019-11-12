/**
 * Create performance observer.
 *
 * @param {string} eventType
 * @param {function} cb
 * @return {PerformanceObserver}
 */

export function createPerformanceObserver(eventType, cb) {
  const type = resolveType(eventType)
  const buffered = type !== 'longtask'
  if (eventTypes.indexOf(type) === -1) throw new Error(`Invalid eventType: ${type}`)
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
    const type = resolveType(eventType)
    if (eventTypes.indexOf(type) === -1) return reject(new Error(`Invalid eventType: ${type}`))
    if (type === 'longtask') return resolve([])
    const po = createPerformanceObserver(
      type,
      /** @param {PerformanceEntry[]} events */ events => {
        po.disconnect()
        clearTimeout(timeout)
        resolve(events)
      }
    )
    const timeout = setTimeout(() => {
      po.disconnect()
      resolve([])
    }, 250)
  })
}

/**
 * The list of supported events.
 *
 * @type {string[]}
 */

const eventTypes = [
  'navigation',
  'mark',
  'measure',
  'resource',
  'element',
  'layout-shift',
  'longtask',
  'largest-contentful-paint',
  'paint'
]

/**
 * Resolve event type to supported event string.
 *
 * @param {string} eventType
 * @return {string}
 */

function resolveType(eventType) {
  switch (eventType) {
    case 'element-timing':
      return 'element'
    case 'long-task':
      return 'longtask'
    case 'first-paint':
    case 'first-contentful-paint':
      return 'paint'
    default:
      return eventType
  }
}

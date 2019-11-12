const eventTypes = ['mark', 'measure', 'resource', 'element', 'layout-shift']

/**
 * Get buffered events by `type`.
 *
 * @param {string} type
 * @return {Promise<PerformanceEntry[]>}
 */

export function getEventsByType(type) {
  return new Promise((resolve, reject) => {
    if (eventTypes.indexOf(type) === -1) return reject(new Error(`Invalid eventType: ${type}`))
    const po = new PerformanceObserver(list => {
      po.disconnect()
      resolve(list.getEntries())
    })
    po.observe({ type, buffered: true })
  })
}

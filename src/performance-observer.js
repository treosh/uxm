import { PO, perf, raf, isObject } from './utils'
const legacyEntryTypes = ['mark', 'measure', 'resource', 'navigation']

/**
 * Create performance observer.
 *
 * @param {EntryType | {type: EntryType, buffered?: boolean}} rawOpts
 * @param {(entries: PerformanceEntry[], observer: PerformanceObserver) => any} callback
 */

export function createPerformanceObserver(rawOpts, callback) {
  const opts = /** @type {{type: EntryType, buffered: boolean}} */ (isObject(rawOpts)
    ? rawOpts
    : { type: rawOpts, buffered: true })
  const type = normalizeEntryType(opts.type)
  if (!PO) return createFakeObserver()
  try {
    const isLegacyType = legacyEntryTypes.indexOf(type) !== -1
    const supportedTypes = PO.supportedEntryTypes || legacyEntryTypes
    if (!isLegacyType && supportedTypes.indexOf(type) === -1) return createFakeObserver()
    const observer = new PO(list => {
      callback(list.getEntries(), observer)
    })
    const observerOpts = isLegacyType ? { entryTypes: [type] } : { ...opts, type }
    observer.observe(observerOpts)
    if (opts.buffered && isLegacyType) {
      raf(() => {
        if (!perf) return
        callback(perf.getEntriesByType(type), observer)
      })
    }
    return observer
  } catch (err) {
    console.warn(err)
    return createFakeObserver()
  }
}

/**
 * Get buffered entries by `type`.
 *
 * @param {EntryType} entryType
 * @return {Promise<PerformanceEntry[]>}
 */

export function getEntriesByType(entryType) {
  const type = normalizeEntryType(entryType)
  return new Promise(resolve => {
    if (perf && legacyEntryTypes.indexOf(type) >= 0) {
      return resolve(perf.getEntriesByType(type))
    }
    if (type === 'longtask' || !PO) return resolve([]) // no buffering for longTasks, fixed in Chrome 81
    const observer = createPerformanceObserver({ type, buffered: true }, events => {
      observer.disconnect()
      clearTimeout(timeout)
      resolve(events)
    })
    const timeout = setTimeout(() => {
      observer.disconnect()
      resolve([])
    }, 250)
  })
}

/**
 * Create a fake performance observer interface when the object is not available.
 * The behaviour is similar to Firefox when `type` is not supported.
 */

function createFakeObserver() {
  return /** @type {PerformanceObserver} */ ({
    observe() {},
    disconnect() {},
    takeRecords() {
      return []
    }
  })
}

/**
 * Resolve event type to supported event strings.
 *
 * @param {string} entryType
 */

function normalizeEntryType(entryType) {
  return /** @type {EntryType} */ (entryType.toLowerCase())
}

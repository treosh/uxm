import { PO, perf, raf, isObject } from './utils'

/** @typedef {import('./utils').Entry} Entry */
/** @typedef {'element' | 'first-input' | 'largest-contentful-paint' | 'layout-shift' | 'longtask' | 'mark' | 'measure' | 'navigation' | 'paint' | 'resource' | 'event'} EntryType */
/** @typedef {EntryType | {type: EntryType, buffered?: boolean}} ObserverOptions */
/** @typedef {(entries: Entry[], observer: PerformanceObserver) => any} ObserverCallback */

const legacyEntryTypes = ['mark', 'measure', 'resource', 'navigation']

/**
 * Create performance observer.
 *
 * @param {ObserverOptions} options
 * @param {ObserverCallback} callback
 */

export function observeEntries(options, callback) {
  const opts = /** @type {{type: EntryType, buffered: boolean}} */ (isObject(options)
    ? options
    : { type: options, buffered: true })
  const type = normalizeEntryType(opts.type)
  if (!PO) return createFakeObserver()
  try {
    const isLegacyType = legacyEntryTypes.indexOf(type) !== -1
    const supportedTypes = PO.supportedEntryTypes || legacyEntryTypes
    if (!isLegacyType && supportedTypes.indexOf(type) === -1) return createFakeObserver()
    const observer = new PO((list) => {
      callback(/** @type {Entry[]} */ (list.getEntries()), observer)
    })
    const observerOpts = isLegacyType ? { entryTypes: [type] } : { ...opts, type }
    observer.observe(observerOpts)
    if (opts.buffered && isLegacyType) {
      raf(() => {
        if (!perf || !perf.getEntriesByType) return
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
 * @return {Promise<Entry[]>}
 */

export function getEntriesByType(entryType) {
  const type = normalizeEntryType(entryType)
  return new Promise((resolve) => {
    if (perf && perf.getEntriesByType && legacyEntryTypes.indexOf(type) >= 0) {
      return resolve(perf.getEntriesByType(type))
    }
    if (type === 'longtask' || !PO) return resolve([]) // no buffering for longTasks, fixed in Chrome 81
    const observer = observeEntries({ type, buffered: true }, (events) => {
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
    },
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

import { debug, warn, perf, raf } from './utils'

/** @typedef {(entries: PerformanceEntry[], observer: PerformanceObserver) => any} EntriesCallback */
/** @typedef {(entry: PerformanceEntry) => any} EntryCallback */
/** @typedef {'element' | 'first-input' | 'largest-contentful-paint' | 'layout-shift' | 'longtask' | 'mark' | 'measure' | 'navigation' | 'paint' | 'resource'} EntryType */
/** @typedef {{ type: EntryType, buffered?: boolean }} EntryOpts */

const PO = typeof PerformanceObserver === 'undefined' ? null : PerformanceObserver
const legacySupportedEntryTypes = ['mark', 'measure', 'resource', 'navigation']
const supportedEntryTypes = legacySupportedEntryTypes.concat([
  'element',
  'first-input',
  'largest-contentful-paint',
  'layout-shift',
  'longtask',
  'paint'
])

/**
 * Create performance observer.
 *
 * @param {EntryOpts} opts
 * @param {EntriesCallback} callback
 * @return {PerformanceObserver}
 */

export function observeEntries(opts, callback) {
  const type = normalizeEntryType(opts.type)
  if (!PO) return createFakeObserver()
  try {
    const isLegacyType = legacySupportedEntryTypes.indexOf(type) !== -1
    const supportedTypes = PO.supportedEntryTypes || legacySupportedEntryTypes
    if (!isLegacyType && supportedTypes.indexOf(type) === -1) return createFakeObserver()

    /** @type {PerformanceObserver} */
    const observer = new PO(list => callback(list.getEntries(), observer))
    const observerOpts = isLegacyType ? { entryTypes: [type] } : opts
    debug('new PO(%o)', observerOpts)
    observer.observe(observerOpts)
    if (opts.buffered && isLegacyType) {
      raf(() => {
        debug('emit buffered')
        if (perf) callback(perf.getEntriesByType(type), observer)
      })
    }
    return observer
  } catch (err) {
    warn(err)
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
    if (perf && legacySupportedEntryTypes.indexOf(type) >= 0) {
      debug('use sync API')
      return resolve(perf.getEntriesByType(type))
    }
    if (type === 'longtask' || !PO) return resolve([]) // no buffering for longTasks
    const observer = observeEntries({ type, buffered: true }, events => {
      observer.disconnect()
      clearTimeout(timeout)
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
 * Resolve event type to supported event strings.
 *
 * @param {EntryType} entryType
 * @return {EntryType}
 */

function normalizeEntryType(entryType) {
  const type = entryType.toLowerCase()
  if (supportedEntryTypes.indexOf(type) === -1) throw new Error(`Invalid event: ${entryType}`)
  // @ts-ignore
  return type
}

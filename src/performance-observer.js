import { debug, warn, perf } from './utils'

/** @typedef {(entries: PerformanceEntry[], observer: PerformanceObserver) => any} EntriesCallback */
/** @typedef {(entry: PerformanceEntry) => any} EntryCallback */
/** @typedef {'element' | 'first-input' | 'largest-contentful-paint' | 'layout-shift' | 'longtask' | 'mark' | 'measure' | 'navigation' | 'paint' | 'resource'} StrictEntryType */
/** @typedef {StrictEntryType | 'eliment-timing' | 'long-task' | 'first-contentful-paint'} EntryType */
/** @typedef {{ type: EntryType, buffered?: boolean, filter?: EntryCallback, map?: EntryCallback }} EntryOpts */

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
 * Observer multiple metrics.
 *
 * @param {Array<EntryType | EntryOpts>} entriesOpts
 * @param {EntriesCallback} callback
 */

export function observeEntries(entriesOpts, callback) {
  entriesOpts.forEach(entryOpts => createPerformanceObserver(entryOpts, callback))
}

/**
 * Create performance observer.
 *
 * @param {EntryType | EntryOpts} entryType
 * @param {EntriesCallback} callback
 * @return {PerformanceObserver}
 */

export function createPerformanceObserver(entryType, callback) {
  /** @type {EntryOpts & { type: StrictEntryType }} */
  const opts =
    typeof entryType === 'string'
      ? { type: normalizeEntryType(entryType) }
      : { ...entryType, type: normalizeEntryType(entryType.type) }
  if (!PO) return createFakeObserver()
  try {
    /** @type {PerformanceObserver} */
    const po = new PO(list => {
      const allEntries = list.getEntries()
      const entries = allEntries
        .filter(e => ((opts.filter ? opts.filter(e) : true)))
        .map(e => ((opts.map ? opts.map(e) : e)))
      // debug('got %s/%s %s entries', entries.length, allEntries.length, opts.type)
      if (entries.length) callback(entries, po)
    })
    if ((PO.supportedEntryTypes || legacySupportedEntryTypes).indexOf(opts.type) === -1) return createFakeObserver()
    const finalOpts = legacySupportedEntryTypes.indexOf(opts.type) === -1 ? opts : { entryTypes: [opts.type] }
    po.observe(finalOpts)
    debug('new PO(%o)', finalOpts)
    return po
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
    const observer = createPerformanceObserver({ type, buffered: true }, events => {
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
 * Resolve event type to supported event strings:
 * - element-timing (because, it's the name of the spec)
 * - long-task (two words should be separated with dash)
 * - first-contentful-paint (that's what user would expect, "paint" is too generic)
 *
 * @param {EntryType} entryType
 * @return {StrictEntryType}
 */

function normalizeEntryType(entryType) {
  const type = entryType.toLowerCase()
  const normalizedType = type === 'element-timing' ? 'element' : type === 'long-task' ? 'longtask' : type
  if (supportedEntryTypes.indexOf(normalizedType) === -1) throw new Error(`Invalid event: ${entryType}`)
  // @ts-ignore
  return normalizedType
}

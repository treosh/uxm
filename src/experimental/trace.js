import { observeEntries } from '../performance-observer'
import { round, getSelector } from '../utils'
import { onVisibilityChange } from '../utils/visibility-change'
import { onLoad } from '../utils/load'
import { filterInputDelays } from './cumulative-input-delay'

/**
 * Record all performance observer events in a trace
 *
 * @param {function} cb
 * @param {{ noResource?: boolean, filterMeasure?: function, filterMarks?: function }} [opts]
 */

export function recordTrace(cb, opts = {}) {
  const result = []
  const observers = []
  const push = (values) => values.length && result.push(...values)
  const observe = (opts, cb) => observers.push(observeEntries(opts, cb))

  onVisibilityChange(() => {
    observers.forEach((o) => o.takeRecords && o.takeRecords())
    observers.forEach((o) => o.disconnect && o.disconnect())
    cb(result)
  })

  observe('paint', (es) => {
    push(es.map((e) => ({ entryType: e.entryType, name: e.name, startTime: round(e.startTime) })))
  })
  observe('longtask', (es) => {
    push(es.map((e) => ({ entryType: e.entryType, startTime: round(e.startTime), duration: round(e.duration) })))
  })
  observe('first-input', (es) => push(es.map(formatInputDelay)))
  observe('event', (es) => push(filterInputDelays(es).map(formatInputDelay)))
  onLoad(() => {
    observe('navigation', (es) =>
      push(
        es.map((e) => ({
          ...formatResource(e),
          type: e.type,
          timeToFirstByte: round(e.responseStart),
          domContentLoaded: round(e.domContentLoadedEventEnd),
          load: round(e.loadEventEnd),
        }))
      )
    )
    if (!opts.noResource) observe('resource', (es) => push(es.map(formatResource)))
  })

  const lcpKeys = []
  observe('largest-contentful-paint', (es) => {
    push(
      es
        .filter((e) => {
          const key = `${e.size}-${e.renderTime}`
          return lcpKeys.indexOf(key) === -1 && lcpKeys.push(key)
        })
        .map((e) => ({
          entryType: e.entryType,
          startTime: round(e.startTime),
          renderTime: round(e.renderTime),
          loadTime: round(e.loadTime),
          size: e.size,
          elementSelector: getSelector(e.element),
        }))
    )
  })
  observe('layout-shift', (es) => {
    push(
      es
        .filter((e) => e.value >= 0.001 && e.hadRecentInput)
        .map((e) => ({
          entryType: e.entryType,
          hadRecentInput: e.hadRecentInput,
          lastInputTime: round(e.lastInputTime),
          startTime: round(e.startTime),
          value: round(e.value, 3),
        }))
    )
  })
  observe('element', (es) => {
    push(
      es.map((e) => ({
        entryType: e.entryType,
        startTime: round(e.startTime),
        renderTime: round(e.renderTime),
        loadTime: round(e.loadTime),
        elementSelector: getSelector(e.element),
        name: e.name,
        identifier: e.identifier,
        size: getSize(e.intersectionRect),
      }))
    )
  })
  observe('measure', (es) => {
    push(
      es
        .filter((e) => (opts.filterMeasure ? opts.filterMeasure(e) : true))
        .map((e) => ({
          entryType: e.entryType,
          startTime: round(e.startTime),
          duration: round(e.duration),
          name: e.name,
          detail: e.detail,
        }))
    )
  })
  observe('mark', (es) => {
    push(
      es
        .filter((e) => (opts.filterMarks ? opts.filterMarks(e) : true))
        .map((e) => ({ entryType: e.entryType, startTime: round(e.startTime), name: e.name, detail: e.detail }))
    )
  })
}

function formatResource(e) {
  return {
    entryType: e.entryType,
    startTime: round(e.startTime),
    duration: round(e.duration),
    name: e.name,
    initiatorType: e.initiatorType,
    transferSize: e.transferSize,
    encodedBodySize: e.encodedBodySize,
    decodedBodySize: e.decodedBodySize,
  }
}

function formatInputDelay(e) {
  return {
    entryType: e.entryType,
    name: e.name,
    duration: e.duration,
    startTime: round(e.startTime, 2),
    processingStart: round(e.processingStart, 2),
    processingEnd: round(e.processingEnd, 2),
  }
}

/**
 * Get size from DOM rect.
 *
 * @param {DOMRectReadOnly | null} rect
 * @return {number | null}
 */

function getSize(rect) {
  if (!rect) return null
  return round(rect.height * rect.width)
}

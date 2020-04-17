import { now } from '../user-timing'
import { loc } from '../utils'

/** @typedef {'popstate' | 'pushstate' | 'replacestate'} EventType */
/**
 * Observe history changes
 * Based on https://github.com/akamai/boomerang/blob/master/plugins/history.js (without go/back/forward instrumentation)
 *
 * @param {(e: { startTime: number, type: EventType, url: string, prevUrl: string }) => any} callback
 */

export function observeHistory(callback) {
  let prevUrl = getUrlWithOrigin()
  const submitEvent = /** @param {EventType} type @param {string} [url] */ (type, url) => {
    url = getUrlWithOrigin(url)
    if (prevUrl !== url) {
      callback({ startTime: now(), type, url, prevUrl })
      prevUrl = url
    }
  }
  window.addEventListener('popstate', () => {
    submitEvent('popstate')
  })
  if (typeof history.pushState === 'function') {
    history.pushState = (function (_pushState) {
      // @ts-ignore
      return function (_state, _title, url) {
        submitEvent('pushstate', url)
        // @ts-ignore
        return _pushState.apply(this, arguments)
      }
    })(history.pushState)
  }
  if (typeof history.replaceState === 'function') {
    history.replaceState = (function (_replaceState) {
      // @ts-ignore
      return function (_state, _title, url) {
        submitEvent('replacestate', url)
        // @ts-ignore
        return _replaceState.apply(this, arguments)
      }
    })(history.replaceState)
  }
}

/** @param {string} [url] */
function getUrlWithOrigin(url) {
  if (!loc) return ''
  return loc.origin + (url || `${loc.pathname || ''}${loc.search || ''}`)
}

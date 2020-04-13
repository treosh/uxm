import { now } from '../..'
import { loc } from '../../src/utils'

/** @typedef {'popstate' | 'pushstate' | 'replacestate'} EventType */
/**
 * Observe history changes
 * Based on https://github.com/akamai/boomerang/blob/master/plugins/history.js (without go/back/forward instrumentation)
 *
 * @param {(e: { startTime: number, type: EventType, url: string, detail: ?object }) => any} cb
 */

export function observeHistory(cb) {
  let currentUrl = getUrlWithOrigin()
  const submitEvent = /** @param {EventType} type */ (type, url = null, detail = null) => {
    url = getUrlWithOrigin(url)
    if (currentUrl !== url) {
      currentUrl = url
      cb({ startTime: now(), type, url, detail })
    }
  }
  window.addEventListener('popstate', () => {
    submitEvent('popstate')
  })
  if (typeof history.pushState === 'function') {
    history.pushState = (function (_pushState) {
      return function (_state, _title, url) {
        submitEvent('pushstate', url, { prevUrl: getUrlWithOrigin() })
        return _pushState.apply(this, arguments)
      }
    })(history.pushState)
  }
  if (typeof history.replaceState === 'function') {
    history.replaceState = (function (_replaceState) {
      return function (_state, _title, url) {
        submitEvent('replacestate', url, { prevUrl: getUrlWithOrigin() })
        return _replaceState.apply(this, arguments)
      }
    })(history.replaceState)
  }
}

function getUrlWithOrigin(url) {
  if (!loc) return ''
  return loc.origin + (url || `${loc.pathname || ''}${loc.search || ''}`)
}

import { now } from '../..'
import { loc } from '../../src/utils'

/** @typedef {'popstate' | 'pushstate' | 'replacestate'} EventType */
/**
 * Observe history changes
 * Based on https://github.com/akamai/boomerang/blob/master/plugins/history.js
 *
 * @param {(e: { startTime: number, type: EventType, url: string, detail: ?object }) => any} cb
 */

export function observeHistory(cb) {
  let currentUrl = getUrl()
  const submitEvent = /** @param {EventType} type */ (type, detail = null) => {
    const url = getUrl()
    if (url && currentUrl !== url) {
      currentUrl = url
      cb({ startTime: now(), type, url, detail })
    }
  }
  window.addEventListener('popstate', () => {
    submitEvent('popstate')
  })
  if (typeof history.pushState === 'function') {
    history.pushState = (function (_pushState) {
      return function (_, title, url) {
        submitEvent('pushstate', { title, url })
        return _pushState.apply(this, arguments)
      }
    })(history.pushState)
  }
  if (typeof history.replaceState === 'function') {
    history.replaceState = (function (_replaceState) {
      return function (_, title, url) {
        submitEvent('replacestate', { title, url })
        return _replaceState.apply(this, arguments)
      }
    })(history.replaceState)
  }
}

function getUrl() {
  return loc ? `${loc.pathname || ''}${loc.search || ''}` : null
}

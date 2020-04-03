import { onVisibilityChange } from '../utils/visibility-change'

/**
 * Create API reporter function, that accepts object and sends it to `url`
 * using `navigator.sendBeackon` when avaiable or fallbacks back to XMLHttpRequest.
 *
 * The function is debounced by default, so it can acummulate object values
 * and send every `wait` time or `maxWait` if the events keep coming.
 *
 * Use `onSend` argument to implement a custom logic.
 *
 * @param {string} url
 * @param {{ wait?: number, maxWait?: number, sessionId?: string, onSend?: function }} [opts]
 * @return {(metrics: object) => void}
 */

export function createApiReporter(url, opts = {}) {
  const sessionId = opts.sessionId || uuid()
  const wait = opts.wait || 2000
  const maxWait = opts.maxWait || 5000
  const onSend = opts.onSend || sendBeacon

  /** @type {Object<string,any>} */
  let metrics = {}
  /** @type {NodeJS.Timeout | null} */
  let timeout = null
  /** @type {NodeJS.Timeout | null} */
  let maxTimeout = null

  const sendMetrics = () => {
    if (timeout) clearTimeout(timeout)
    timeout = null
    if (maxTimeout) clearTimeout(maxTimeout)
    maxTimeout = null
    if (!Object.keys(metrics).length) return
    onSend(url, { sessionId, ...metrics })
    metrics = {}
  }

  // send metrics on the tab close, last
  onVisibilityChange(sendMetrics, 1)

  // warn on metric replacement
  // and assign new values and append array values.
  return function apiReporter(newMetrics) {
    Object.keys(newMetrics).forEach(key => {
      const value = newMetrics[key]
      if (typeof metrics[key] !== 'undefined' && Array.isArray(value) && !Array.isArray(metrics[key])) {
        console.warn('double metric occurence, replace %s=%s with %s', key, metrics[key], value)
      }
      if (Array.isArray(value)) {
        if (!Array.isArray(metrics[key])) metrics[key] = []
        metrics[key].push(...value)
      } else {
        metrics[key] = value
      }
    })
    if (!maxTimeout) maxTimeout = setTimeout(sendMetrics, maxWait)
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(sendMetrics, wait)
  }
}

/**
 * Send beackon to URL of fallaback to sync XMLHttpRequest request.
 * https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon
 *
 * @param {string} url
 * @param {object} metrics
 */

function sendBeacon(url, metrics) {
  if (typeof navigator === 'undefined') return
  if (navigator.sendBeacon) return navigator.sendBeacon(url, JSON.stringify(metrics))
  const client = new XMLHttpRequest()
  client.open('POST', url, false) // third parameter indicates sync xhr
  client.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8')
  client.send(JSON.stringify(metrics))
}

/**
 * Generate UUID: https://gist.github.com/jed/982883
 * @return {string}
 */

function uuid() {
  return ('' + 1e7 + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, a => {
    // @ts-ignore
    return (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
  })
}

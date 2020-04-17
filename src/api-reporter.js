import { onVisibilityChange } from './utils/visibility-change'

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
 * @param {{ initial?: object, beforeSend?: function, onSend?: (url: string, values: object) => any }} [options]
 * @return {(metrics: Object<string,any>) => void}
 */

export function createApiReporter(url, options = {}) {
  let isSent = false
  const values = options.initial || Object.create(null)
  const sendValues = () => {
    if (isSent) console.warn('data is already sent')
    isSent = true
    if (options.beforeSend) options.beforeSend()
    if (options.onSend) {
      options.onSend(url, values)
    } else {
      if (typeof navigator === 'undefined') return
      if (navigator.sendBeacon) return navigator.sendBeacon(url, JSON.stringify(values))
      const client = new XMLHttpRequest()
      client.open('POST', url, false) // third parameter indicates sync xhr
      client.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8')
      client.send(JSON.stringify(values))
    }
  }

  // send metrics on the tab close, last
  onVisibilityChange(sendValues, 1)

  // warn on metric replacement
  // and assign new values and append array values.
  return function apiReporter(newMetrics) {
    Object.keys(newMetrics).forEach((key) => {
      const value = newMetrics[key]
      if (typeof values[key] !== 'undefined' && Array.isArray(value) && !Array.isArray(values[key])) {
        console.warn('double metric occurence, replace %s=%s with %s', key, values[key], value)
      }
      if (Array.isArray(value)) {
        if (!Array.isArray(values[key])) values[key] = []
        values[key].push(...value)
      } else {
        values[key] = value
      }
    })
  }
}

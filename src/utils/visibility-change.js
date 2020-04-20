/** @type {[Function, number][]} */
let visiblityChangeCallbacks = []
let isVisibilitChangeEnabled = false

/**
 * Listen for `visibilitychange` event, or ignore if it's already fired.
 *
 * @param {function} callback
 * @param {number} [order]
 */

export function onVisibilityChange(callback, order = 0) {
  visiblityChangeCallbacks.push([callback, order])
  if (isVisibilitChangeEnabled) return
  isVisibilitChangeEnabled = true
  document.addEventListener(
    'visibilitychange',
    function visibilityChangeListener() {
      if (document.visibilityState === 'hidden') {
        visiblityChangeCallbacks.sort((a, b) => a[1] - b[1]).forEach(([cb]) => cb())
        visiblityChangeCallbacks = []
        document.removeEventListener('visibilitychange', visibilityChangeListener, true)
      }
    },
    true
  )
}

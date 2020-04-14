import { raf } from './index'

/** @type {Function[]} */
let loadCallbacks = []
let isLoadEnabled = false

/**
 * Listen for `load` event, or fire immediately.
 *
 * @param {function} callback
 */

export function onLoad(callback) {
  if (document.readyState === 'complete') return raf(() => callback())
  loadCallbacks.push(callback)
  if (isLoadEnabled) return
  isLoadEnabled = true

  addEventListener(
    'load',
    function onLoadListener() {
      removeEventListener('load', onLoadListener, true)
      raf(() => {
        loadCallbacks.forEach((cb) => cb())
        loadCallbacks = []
      })
    },
    true
  )
}

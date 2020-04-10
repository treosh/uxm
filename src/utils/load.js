import { raf } from './index'

/** @type {Function[]} */
let loadCallbacks = []
let isLoadEnabled = false

export function onLoad(cb) {
  if (document.readyState === 'complete') return raf(cb)
  loadCallbacks.push(cb)
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

// @ts-check
import { perf, round, raf } from './utils'
/** @typedef {(metrics: { timeToFirstByte: number, domContentLoaded: number, load: number, serverTiming: object[] } | null) => any} NavigationCallback */

/**
 * Resolve with navigation arguments.
 *
 * @param {NavigationCallback} cb
 */

export function onNavigation(cb) {
  if (!perf || !perf.timing) return cb(null)
  if (document.readyState != 'complete') {
    return addEventListener(
      'load',
      function loadListener() {
        removeEventListener('load', loadListener, true)
        raf(resolveNavigationTimingMetrics)
      },
      true
    )
  }
  raf(resolveNavigationTimingMetrics) // resolve async

  function resolveNavigationTimingMetrics() {
    if (!perf || !perf.timing) return cb(null)
    const nt = perf.timing
    const navStart = nt.navigationStart
    const [nav] = perf.getEntriesByType('navigation')
    cb({
      timeToFirstByte: round(nt.responseStart - navStart),
      domContentLoaded: round(nt.domContentLoadedEventEnd - navStart),
      load: round(nt.loadEventEnd - navStart),
      serverTiming: nav ? nav.serverTiming : []
    })
  }
}

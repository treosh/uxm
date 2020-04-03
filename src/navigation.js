import { round, raf, perf } from './utils'

/**
 * Get navigation timing.
 *
 * @return {Promise<{timeToFirstByte: number, domContentLoaded: number, onLoad: number} | null>}
 */

export function getNavigation() {
  return new Promise(resolve => {
    if (!perf || !perf.timing) return resolve(null)
    const t = perf.timing
    if (document.readyState !== 'complete') {
      addEventListener(
        'load',
        function onLoad() {
          removeEventListener('load', onLoad, true)
          raf(resolveNavigationTiming)
        },
        true
      )
    } else {
      resolveNavigationTiming()
    }

    function resolveNavigationTiming() {
      resolve({
        timeToFirstByte: round(t.responseStart - t.navigationStart),
        domContentLoaded: round(t.domContentLoadedEventEnd - t.navigationStart),
        onLoad: round(t.loadEventEnd - t.navigationStart)
      })
    }
  })
}

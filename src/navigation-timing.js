import { perf, round, raf } from './utils'

/**
 * Get navigation timing.
 * Listen for "load" event and return useful metrics including raw navigation event.
 *
 * @return {Promise<{ timeToFirstByte: number, domContentLoaded: number, load: number, serverTiming: object[], navigation?: object } | null>}
 */

export function getNavigationTiming() {
  return new Promise(resolve => {
    if (!perf || !perf.timing) return resolve(null)
    if (document.readyState != 'complete') {
      return addEventListener('load', () => raf(resolveNavigationTimingMettrics))
    }
    resolveNavigationTimingMettrics()

    function resolveNavigationTimingMettrics() {
      if (!perf || !perf.timing) return resolve(null)
      const nt = perf.timing
      const navStart = nt.navigationStart
      const [nav] = perf.getEntriesByType('navigation')
      resolve({
        timeToFirstByte: round(nt.responseStart - navStart),
        domContentLoaded: round(nt.domContentLoadedEventEnd - navStart),
        load: round(nt.loadEventEnd - navStart),
        serverTiming: nav ? nav.serverTiming : [],
        navigation: nav
      })
    }
  })
}

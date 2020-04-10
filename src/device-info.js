import { nav, loc, doc } from './utils'

/**
 * Get device information.
 * - Effective connection type: https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 * - Device memory in GB rounded to 2: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
 */

export function getDeviceInfo() {
  const conn = nav && nav.connection ? nav.connection : null
  return {
    url: loc ? loc.href : undefined,
    referrer: doc ? doc.referrer : undefined,
    userAgent: nav ? nav.userAgent : undefined,
    memory: nav ? nav.deviceMemory : undefined,
    cpus: nav ? nav.hardwareConcurrency : undefined,
    connection: conn ? { effectiveType: conn.effectiveType, rtt: conn.rtt, downlink: conn.downlink } : undefined,
  }
}

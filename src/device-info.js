/** @typedef {'slow-2g' | '2g' | '3g' | '4g'} EffectiveConnectionType */
/** @typedef {{effectiveType: EffectiveConnectionType}} NetworkInformation */
/** @type {{ connection?: NetworkInformation, mozConnection?: NetworkInformation, webkitConnection?: NetworkInformation, deviceMemory?: number, hardwareConcurrency?:number, userAgent: string } | null} */
const nav = typeof navigator === 'undefined' ? null : navigator
const loc = typeof location === 'undefined' ? null : location

/**
 * Get device information.
 * - Effective connection type: https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 * - Device memory in GB rounded to 2: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
 *
 * @return {{ url?: string, userAgent?: string, connection?: EffectiveConnectionType, deviceMemory?: number, cpus?: number }}
 */

export function getDeviceInfo() {
  return {
    url: loc ? loc.href : undefined,
    userAgent: nav ? nav.userAgent : undefined,
    connection: nav && nav.connection ? nav.connection.effectiveType : undefined,
    deviceMemory: nav ? nav.deviceMemory : undefined,
    cpus: nav ? nav.hardwareConcurrency : undefined
  }
}

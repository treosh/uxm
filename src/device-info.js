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
 * @return {{ url?: string, userAgent?: string, deviceMemory?: number, effectiveConnectionType?: EffectiveConnectionType, hardwareConcurrency?: number }}
 */

export function getDeviceInfo() {
  return {
    url: getUrl(),
    userAgent: getUserAgent(),
    deviceMemory: getDeviceMemory(),
    effectiveConnectionType: getEffectiveConnectionType(),
    hardwareConcurrency: getHardwareConcurrency()
  }
}

/**
 * Get effective connection type.
 * https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 *
 * @return {EffectiveConnectionType | undefined}
 */

function getEffectiveConnectionType() {
  return nav && nav.connection ? nav.connection.effectiveType : undefined
}

/**
 * Get device memory in GB rounded to 2.
 * https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
 *
 * @return {number | undefined}
 */

function getDeviceMemory() {
  return nav ? nav.deviceMemory : undefined
}

/**
 * Get CPU cores.
 *
 * @return {number | undefined}
 */

function getHardwareConcurrency() {
  return nav ? nav.hardwareConcurrency : undefined
}

/**
 * Get current url.
 *
 * @return {string | undefined}
 */

function getUrl() {
  return loc ? loc.href : undefined
}

/**
 * Get user-agent header.
 *
 * @return {string | undefined}
 */

function getUserAgent() {
  return nav ? nav.userAgent : undefined
}

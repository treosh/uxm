/** @type {{ connection?: NetworkInformation, mozConnection?: NetworkInformation, webkitConnection?: NetworkInformation, deviceMemory?: number, hardwareConcurrency?:number, userAgent: string } | null} */
const nav = typeof navigator !== 'undefined' ? navigator : null

/** @typedef {'slow-2g' | '2g' | '3g' | '4g'} EffectiveConnectionType */
/** @typedef {{effectiveType: EffectiveConnectionType}} NetworkInformation */

/**
 * Get effective connection type.
 * https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 *
 * @return {EffectiveConnectionType | null}
 */

export function getEffectiveConnectionType() {
  const conn = nav ? nav.connection || nav.mozConnection || nav.webkitConnection : null
  return conn ? conn.effectiveType : null
}

/**
 * Get device memory in GB rounded to 2.
 * https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
 *
 * @return {number | null}
 */

export function getDeviceMemory() {
  return nav ? nav.deviceMemory || null : null
}

/**
 * Get CPU cores.
 *
 * @return {number | null}
 */

export function getHardwareConcurrency() {
  return nav ? nav.hardwareConcurrency || null : null
}

/**
 * Get current url.
 *
 * @return {string}
 */

export function getUrl() {
  return window.location.href
}

/**
 * Get user-agent header.
 *
 * @return {string | null}
 */

export function getUserAgent() {
  return nav ? nav.userAgent : null
}

import { isUndefined } from './utils'

/** @typedef {'slow-2g' | '2g' | '3g' | '4g'} EffectiveConnectionType */
/** @typedef {{effectiveType: EffectiveConnectionType}} NetworkInformation */
/** @type {{ connection?: NetworkInformation, mozConnection?: NetworkInformation, webkitConnection?: NetworkInformation, deviceMemory?: number, hardwareConcurrency?:number, userAgent: string } | null} */
const nav = isUndefined(navigator) ? null : navigator

/**
 * Get effective connection type.
 * https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 *
 * @return {EffectiveConnectionType | null}
 */

export function getConnectionType() {
  return nav && nav.connection ? nav.connection.effectiveType : null
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

export function getCpus() {
  return nav ? nav.hardwareConcurrency || null : null
}

/**
 * Get current url.
 *
 * @return {string | null}
 */

export function getUrl() {
  return isUndefined(location) ? location.href : null
}

/**
 * Get user-agent header.
 *
 * @return {string | null}
 */

export function getUserAgent() {
  return nav ? nav.userAgent : null
}

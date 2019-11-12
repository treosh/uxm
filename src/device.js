/**
 * Get effective connection type.
 * https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 *
 * @return {EffectiveConnectionType | null}
 */

export function getEffectiveConnectionType() {
  const conn =
    typeof navigator !== 'undefined'
      ? navigator.connection || navigator.mozConnection || navigator.webkitConnection
      : null
  return conn ? conn.effectiveType : null
}

/**
 * Get device memory in GB rounded to 2.
 *
 * @return {number | null}
 */

export function getDeviceMemory() {
  const deviceMemory = typeof navigator !== 'undefined' ? navigator.deviceMemory : undefined
  if (deviceMemory === undefined) return null
  return deviceMemory
}

/**
 * Get CPU cores.
 *
 * @return {number | null}
 */

export function getHardwareConcurrency() {
  const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined
  if (hardwareConcurrency === undefined) return null
  return hardwareConcurrency
}

/**
 * Get current url.
 *
 * @return {String}
 */

export function getUrl() {
  return window.location.href
}

/**
 * Get user-agent header.
 *
 * @return {String}
 */

export function getUserAgent() {
  return window.navigator.userAgent
}

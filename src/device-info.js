/** @typedef {'slow-2g' | '2g' | '3g' | '4g'} EffectiveConnectionType */
/** @typedef {'phone' | 'tablet' | 'desktop'} DeviceType */
/** @typedef {{effectiveType: EffectiveConnectionType}} NetworkInformation */
/** @type {{ connection?: NetworkInformation, mozConnection?: NetworkInformation, webkitConnection?: NetworkInformation, deviceMemory?: number, hardwareConcurrency?:number, userAgent: string } | null} */
const nav = typeof navigator === 'undefined' ? null : navigator
const loc = typeof location === 'undefined' ? null : location

/**
 * Get device information.
 * - Effective connection type: https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 * - Device memory in GB rounded to 2: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
 *
 * @return {{ url?: string, userAgent?: string, deviceType?: DeviceType, deviceMemory?: number, effectiveConnectionType?: EffectiveConnectionType, hardwareConcurrency?: number }}
 */

export function getDeviceInfo() {
  return {
    url: getUrl(),
    userAgent: getUserAgent(),
    deviceType: getDeviceType(),
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

export function getEffectiveConnectionType() {
  return nav && nav.connection ? nav.connection.effectiveType : undefined
}

/**
 * Get device memory in GB rounded to 2.
 * https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory
 *
 * @return {number | undefined}
 */

export function getDeviceMemory() {
  return nav ? nav.deviceMemory : undefined
}

/**
 * Get CPU cores.
 *
 * @return {number | undefined}
 */

export function getHardwareConcurrency() {
  return nav ? nav.hardwareConcurrency : undefined
}

/**
 * Get current url.
 *
 * @return {string | undefined}
 */

export function getUrl() {
  return loc ? loc.href : undefined
}

/**
 * Get user-agent header.
 *
 * @return {string | undefined}
 */

export function getUserAgent() {
  return nav ? nav.userAgent : undefined
}

/**
 * Get device type.
 * based on https://github.com/matthewhudson/current-device/blob/master/src/index.js
 *
 * @return {DeviceType | undefined}
 */

export function getDeviceType() {
  const ua = (getUserAgent() || '').toLowerCase()
  if (!ua) return undefined
  const find = /** @param {string} str */ str => ua.indexOf(str) !== -1

  // windows
  const isWindows = find('windows')
  const isWindowsPhone = isWindows && find('phone')
  const isWindowsTablet = isWindows && find('touch') && !isWindowsPhone

  // ios
  const isIphone = !isWindows && find('iphone')
  const isIpod = find('ipod')
  const isIpad = find('ipad')

  // android
  const isAndroid = !isWindows && find('android')
  const isAndroidPhone = isAndroid && find('mobile')
  const isAndroidTablet = isAndroid && !find('mobile')

  // detect device
  const isPhone = isAndroidPhone || isIphone || isIpod || isWindowsPhone
  const isTablet = isIpad || isAndroidTablet || isWindowsTablet
  return isPhone ? 'phone' : isTablet ? 'tablet' : 'desktop'
}

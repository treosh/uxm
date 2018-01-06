// based on https://github.com/matthewhudson/current-device/blob/master/src/index.js
// returns “phone”, “tablet”, or “desktop”

export function getDeviceType() {
  const ua = window.navigator.userAgent.toLowerCase()
  const find = str => ua.indexOf(str) !== -1

  // windows
  const isWindows = find('windows')
  const isWindowsPhone = isWindows && find('phone')
  const isWindowsTablet = isWindows && (find('touch') && !isWindowsPhone)

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

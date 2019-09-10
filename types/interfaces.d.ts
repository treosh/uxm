interface PerformanceEntry {
  responseStart: number
  domContentLoadedEventEnd: number
  loadEventEnd: number
  initiatorType: string
  transferSize: number
}

type NetworkInformation = {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
}

interface Navigator {
  deviceMemory: number
  connection: NetworkInformation
  mozConnection: NetworkInformation
  webkitConnection: NetworkInformation
}

interface Window {
  PerformancePaintTiming: object
  __lt: {
    e: []
  }
}

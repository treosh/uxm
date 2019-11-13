type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g'
type NetworkInformation = {
  effectiveType: EffectiveConnectionType
}

interface Navigator {
  deviceMemory: number
  connection: NetworkInformation
  mozConnection: NetworkInformation
  webkitConnection: NetworkInformation
}

interface PerformanceEntry {
  responseStart: number
  domContentLoadedEventEnd: number
  loadEventEnd: number
  processingStart: number
  renderTime: number
  loadTime: number
  serverTiming: object[]
  hadRecentInput: boolean
  value: number
}

interface Performance {
  mark(markName: string): PerformanceMark
  measure(measureName: string, startMarkName?: string, endMarkName?: string): PerformanceMeasure
}

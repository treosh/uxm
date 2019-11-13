interface PerformanceEntry {
  responseStart: number
  domContentLoadedEventEnd: number
  loadEventEnd: number
  initiatorType: string
  transferSize: number
}

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
  processingStart: number
  renderTime: number
  loadTime: number
  serverTiming: object[]
  hadRecentInput: boolean
  value: number
}

interface PerformanceEventCallback {
  (events: PerformanceEntry[]): any
}
interface PerformanceMetricCallback {
  (metric: number | null): any
}

interface Performance {
  mark(markName: string): PerformanceMark
  measure(measureName: string, startMarkName?: string, endMarkName?: string): PerformanceMeasure
}

interface Window {
  PerformancePaintTiming: object
}

type MetricType = 'fcp' | 'lcp' | 'fid' | 'cls'

type EntryType =
  | 'element'
  | 'first-input'
  | 'largest-contentful-paint'
  | 'layout-shift'
  | 'longtask'
  | 'mark'
  | 'measure'
  | 'navigation'
  | 'paint'
  | 'resource'
  | 'event'

interface PerformanceEntry {
  // user timing
  detail?: object
  // first-input
  processingStart: number
  // largest-contentful-paint
  element: HTMLElement
  size: number
  renderTime: number
  loadTime: number
  // layout-shift
  value: number
  hadRecentInput: boolean
}

type NetworkInformation = {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
  rtt: number
  downlink: number
}

interface Navigator {
  deviceMemory: number
  connection: NetworkInformation
  mozConnection: NetworkInformation
  webkitConnection: NetworkInformation
}

interface Performance {
  mark(markName: string, markOptions?: object): PerformanceEntry | undefined
  measure(measureName: string, startOrMeasureOptions?: string | object, endMark?: string): PerformanceEntry | undefined
}

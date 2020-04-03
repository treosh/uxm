interface PerformanceEntry {
  // first-inpur
  processingStart: number
  // user timing
  detail?: object
  // layout-shift
  value: number
  lastInputTime: number
  hadRecentInput: boolean
  // element | largest-contentful-paint
  element: HTMLElement
  size: number
  renderTime: number
  loadTime: number
  identifier: string
  intersectionRect: DOMRectReadOnly
  // resource
  initiatorType: string
  transferSize: number
  encodedBodySize: number
  decodedBodySize: number
  // navigation
  type: string
  redirectCount: number
  responseStart: number
  domContentLoadedEventEnd: number
  loadEventEnd: number
}

interface Performance {
  mark(markName: string, markOptions?: object): PerformanceEntry | undefined
  measure(measureName: string, startOrMeasureOptions?: string | object, endMark?: string): PerformanceEntry | undefined
}

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
  element: HTMLElement
  size: number
  transferSize: number
  initiatorType: string
}

import { getDeviceInfo, collectLoad, collectFcp, collectLcp, collectFid, collectCls } from '..'

// init `metrics` and get device information

const { connection } = getDeviceInfo()
const metrics = { effectiveConnectionType: connection.effectiveType }

// collect loading metrics

collectLoad(({ value: onLoad, detail: { domContentLoaded, timeToFirstByte } }) => {
  metrics.timeToFirstByte = timeToFirstByte
  metrics.domContentLoaded = domContentLoaded
  metrics.onLoad = onLoad
})

// collect user-centric metrics

collectFcp(({ value }) => (metrics.firstContentfulPaint = value))
collectLcp(({ value }) => (metrics.largestContentfulPaint = value))
collectFid(({ value }) => (metrics.firstInputDelay = value))
collectCls(({ value }) => (metrics.cumulativeLayoutShift = value))

// all metrics are collected on "visibilitychange" event

console.log(metrics)

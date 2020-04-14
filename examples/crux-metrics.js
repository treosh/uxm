import { getDeviceInfo, collectLoad, collectFcp, collectLcp, collectFid, collectCls, onVisibilityChange } from '..'

// init `metrics` and get device information

const { url, connection } = getDeviceInfo()
const metrics = { url, effectiveConnectionType: connection.effectiveType }

// collect loading metrics

collectLoad(({ value: load, detail: { domContentLoaded, timeToFirstByte } }) => {
  metrics.timeToFirstByte = timeToFirstByte
  metrics.domContentLoaded = domContentLoaded
  metrics.load = load
})

// collect user-centric metrics

collectFcp(({ value }) => (metrics.firstContentfulPaint = value))
collectLcp(({ value }) => (metrics.largestContentfulPaint = value))
collectFid(({ value }) => (metrics.firstInputDelay = value))
collectCls(({ value }) => (metrics.cumulativeLayoutShift = value))

// all metrics are collected on "visibilitychange" event

onVisibilityChange(() => {
  console.log(metrics)
}, 1)

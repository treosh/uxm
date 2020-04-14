import { collectFcp, collectFid } from '..'

collectFcp(reportToGoogleAnalytics)
collectFid(reportToGoogleAnalytics)

function reportToGoogleAnalytics(metric) {
  ga('send', 'event', {
    eventCategory: 'Performance Metrics',
    eventAction: 'track',
    [metric.metricType]: metric.value,
  })
}

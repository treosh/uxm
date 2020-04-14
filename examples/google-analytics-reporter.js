import { collectFcp, collectLcp } from '..'

collectFcp(reportToGoogleAnalytics)
collectLcp(reportToGoogleAnalytics)

function reportToGoogleAnalytics(metric) {
  ga('send', 'event', {
    eventCategory: 'Performance Metrics',
    eventAction: 'track',
    [metric.metricType]: metric.value,
  })
}

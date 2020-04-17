import { collectMetrics } from '../../src'

console.log('content.js: setup metrics')
collectMetrics(['fcp', 'fid', { type: 'lcp', emit: true }, { type: 'cls', emit: true }], ({ metricType, value }) => {
  chrome.runtime.sendMessage({ [metricType]: value })
})

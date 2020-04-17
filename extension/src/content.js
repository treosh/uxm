import { collectMetrics } from '../../src'

collectMetrics(['fcp', 'fid', { type: 'lcp', emit: true }, { type: 'cls', emit: true }], ({ metricType, value }) => {
  chrome.runtime.sendMessage({ [metricType]: value })
})

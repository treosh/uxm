import { collectMetrics, createApiReporter } from '..'

const report = createApiReporter('/collect')
collectMetrics(['fcp', 'lcp', 'fid', 'cls'], ({ metricType, value }) => report({ [metricType]: value }))

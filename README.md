<p align="center">
  <img src="./.github/logo.png" />
</p>

<p align="center">
  An utility library for collecting user-centric performance metrics.
</p>

<p align="center">
  <a href="#">Why?</a> • <a href="#usage">Usage</a> • <a href="#api">API</a> • <a href="#credits">Credits</a>
</p>

<br/>
<br/>

## Usage

[![](https://img.shields.io/npm/v/uxm.svg)](https://npmjs.org/package/uxm)
[![](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

```bash
npm install uxm
```

Collect [user-centric metrics](https://web.dev/metrics/) and send data to your API (1.5Kb):

```js
import { collectMetrics, createApiReporter } from 'uxm'

const report = createApiReporter('/collect')
collectMetrics(['fcp', 'lcp', 'fid', 'cls'], ({ metricType, value }) => report({ [metricType]: value }))
```

Measure React view render performance (0.65 Kb):

```js
import { time, timeEndPaint } from 'uxm'

export function App() {
  useView('app')
  return 'Hello from React'
}

function useView(viewName) {
  const label = `render:${viewName}`
  time(label)
  useEffect(() => timeEndPaint(label), [])
}
```

Build custom layout-shifts metrics for each SPA view (0.8KB):

```js
import { observeEntries } from 'uxm'
import { observeHistory } from 'uxm/experimental'

/** @type {{ url: string, cls: number }[]} */
let views = []
let cls = 0

// cummulate `layout-shift` values, with an input

observeEntries('layout-shift', (layoutShiftEntries) => {
  layoutShiftEntries.forEach((e) => {
    if (!e.hadRecentInput) cls += e.value
  })
})

// observe `history` changes
// and reset `cls` when it changes

observeHistory((e) => {
  views.push({ url: e.prevUrl, cls })
  cls = 0
})
```

Collect rendering metrics (FCP/LCP) to google analytics (1 Kb), [learn more about using google analytics for site speed monitoring](https://philipwalton.com/articles/the-google-analytics-setup-i-use-on-every-site-i-build/#performance-tracking):

```js
import { collectFcp, collectLcp } from 'uxm'

collectFcp(reportToGoogleAnalytics)
collectLcp(reportToGoogleAnalytics)

function reportToGoogleAnalytics(metric) {
  ga('send', 'event', {
    eventCategory: 'Performance Metrics',
    eventAction: 'track',
    [metric.metricType]: metric.value,
  })
}
```

Collect [CrUX-like metrics](https://developers.google.com/web/tools/chrome-user-experience-report/) (1.55Kb):

```js
import { getDeviceInfo, collectLoad, collectFcp, collectLcp, collectFid, collectCls } from 'uxm'

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
//  {
//    "effectiveConnectionType": "4g",
//    "timeToFirstByte": 1204,
//    "domContentLoaded": 1698,
//    "onLoad": 2508
//    "firstContentfulPaint": 1646,
//    "largestContentfulPaint": 3420,
//    "firstInputDelay": 12,
//    "cumulativeLayoutShift": 0.12,
//  }
```

## API

```js
// metrics
// type MetricType = 'fcp' | 'lcp' | 'fid' | 'cls'
collectMetrics([metricType | { type: MetricType, ...options }], ({ metricType, value, detail }) => {})

// each metric separately
collectFcp(cb)
collectLcp(cb)
collectFid(cb)
collectLcp(cb)

// get loading metrics
collectLoad((load) => {})

// perf observer
// type EntryType = 'element' | 'first-input' | 'largest-contentful-paint' | 'layout-shift' | 'longtask' |
//                  'mark' | 'measure' | 'navigation' | 'paint' | 'resource' | 'event'
observeEntries(entryType | { type: EntryType, buffered?: boolean }, (entries, observer) => {})
getEntriesByType(entryType) => Promise<PerformanceEntry[]>

// device info
getDeviceInfo() => { url?: string, referrer?: string, userAgent?: string, memory?: number, cpus?: number,
                     connection?: { effectiveType: string, rtt: number, downlink: number } }

// user timing
mark(markName, [markOptions])
measure(measureName, startOrMeasureOptions, endMark)
now()
time(label, [startLabel])
timeEnd(label, [startLabel]) | timeEndPaint(label, [startLabel])

// api reporter
const report = createReporter(url, { initial, onSend, beforeSend })
report.getValues() // get collected values
report.send() // force send

// experimental
collectCid() // cummulative input delay
recordTrace() // record all performance observer entries in one array
calcSpeedScore({ fcp, lcp, fid, cls }) // value from 0 ... 1 (based on LH score algorithm)

// notes:
// - collectLoad is 4 letters, because it's not a good metric
// - each metric is a function, because perf & bundle size matters
// - no Promise, because API could lead to confusion, some metrics takes the whole section to produce
```

## Credits

[![Treo.sh - Page speed monitoring with Lighthouse](https://user-images.githubusercontent.com/158189/66038877-a06abd80-e513-11e9-837f-097f44544326.jpg)](https://treo.sh/)

[![](https://github.com/treosh/uxm/workflows/CI/badge.svg)](https://github.com/treosh/uxm/actions?query=workflow%3ACI)
[![](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Made with ❤️ by [Treo.sh](https://treo.sh/).

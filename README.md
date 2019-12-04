<p align="center">
  <img width="1045" alt="UXM - User Experience Metrics" src="https://user-images.githubusercontent.com/158189/69014933-46249f80-098f-11ea-98d4-095d112afd56.png">
</p>

<p align="center">
  A modular library for collecting<br />
  front-end performance metrics.
</p>

<p align="center">
  <a href="#">Why?</a> • <a href="#usage">Usage</a> • <a href="#api">API</a> • <a href="#credits">Credits</a>
</p>

<br/>
<br/>

Core design ideas:

1. Build the core, that equally works in 3 major browsers: Chrome/FF/Safari and extend it with a spec development
2. Provide low-level building blocks for R&D of the new metrics
3. Provide simple API to observe modern metrics: FCP/FID/LCP/CLS (Chrome only)
4. Focus on device difference (memory, cpu, network), not a browser difference (Chrome only)
5. Be able to monitor SPA

## Usage

[![](https://img.shields.io/npm/v/uxm.svg)](https://npmjs.org/package/uxm)
[![](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Install:

```bash
npm install uxm@next # 2.0.0-beta
```

**Track [CrUX-like](https://developers.google.com/web/tools/chrome-user-experience-report) metrics**.

```js
import { collectMetrics, getDeviceInfo } from 'uxm'
import { createApiReporter } from 'uxm/api-reporter'

const report = createApiReporter('/beacon-url', { initial: getDeviceInfo() })
collectMetrics(['fcp', 'lcp', 'fid', 'cls', 'ttfb', 'load', 'dcl'], ({ type, value }) => report({ [type]: value }))
```

**Report [user-centric metrics](https://web.dev/metrics/) to Google Analytics**.

```js
import { collectMetrics } from 'uxm'
import { report } from 'uxm/google-analytics-reporter'

collectMetrics(['fcp', 'lcp', 'fid', 'cls'], report)
```

**Measure duration of compute intensive tasks**.

- better primitives for measuring time & time of the last paint
- simple UI to observe & collect records

```js
import { time, timeEnd, observeEntries } from 'uxm'

// measure time of the "my-task"
time('my-task')
computeIntensiveTask()
timeEnd('my-task')

// collect measures asyncronously
observeEntries({ type: 'measure', buffered: true }, measures => {
  /* filter, map, and report data to analytics. */
})
```

Integrate with React and track time to render a view:

```js
import { useEffect } from 'react'
import { time, timeEndPaint, observeEntries } from 'uxm'

function App() {
  useView('my-app')
  return <MoreComponents />
}

// collect measure after the component did mount and all paint events completed
function useView(label) {
  time(label)
  useEffect(() => timeEndPaint(label), [])
}

// report "measure" event to analytics.
observeEntries({ type: 'measure', buffered: true }, measures => {
  /* filter, map, and report data to analytics. */
})
```

Associate metrics with device information:

```js
// features:
// - access modern APIs when available
import { getDeviceInfo, getMetricByType } from 'uxm/device'

const deviceInfo = getDeviceInfo()

reportToAnalytics({
  ttfb: await getMetricByType('ttfb'),
  fcp: await getMetricByType('fcp'),
  memory: deviceInfo.memory, // 1, 2, 4, 8, 16 ... GB of memory rounding down to the nearest power of 2
  cpus: deviceInfo.hardwareConcurrency, // 1, 2, 4, 8 ... CPU cores
  connection: deviceInfo.effectiveConnectionType // 2g | 3g | 4g
})
```

Observe performance events and collect long tasks (only Chrome):

- doesn't fail when PerformanceObserver is not available, or event is new
- always return PO-like object with 2 methods: disconnect & takeRecords
- normalize event names

```js
import { createEntriesObserver } from 'uxm'

// collect longTasks
const longTasks = []
const observer = createEntriesObserver({ type: 'long-task' }, events => {
  longTasks.push(...events.map(e => e.duration))
})

// extra methods
observer.disconnect() // cancel observation
observer.takeRecords() // flush recent events
```

Get buffered entries and track layout shift between view changes (only Chrome):

- return [] when event is unknown or PerformanceObserver is unavailable
- automatic timeout if no events triggered
- normalized event names
- use modern API and fallback to legacy for mark/measure/resource

```js
import { geEntriesByType } from 'uxm'

// track latest shift time
let latestStartTime = 0

// filter and compute layout shifts
const layoutShifts = await geEntriesByType('layout-shift')
const cummulativeLayoutShift = layoutShifts
  .filter(lsEvent => lsEvent.startTime > latestStartTime)
  .reduce((memo, lsEvent) => {
    // Only count layout shifts without recent user input.
    // and collect percentage value
    if (!lsEvent.hadRecentInput) {
      memo += 100 * lsEvent.value
    }
    return memo
  }, 0)

// store latest time to filter next events
latestStartTime = layoutShifts[layoutShifts.length - 1].startTime
```

## API

API:

- Metrics:
  - `collectMetrics(MetricOpts[], (metric: Metric) => {})`
  - `getMetricByType(type: string) => Promise<Metric>`
- Performance observer (low-level entries)
  - `observeEntries({ type: string, buffered?: boolean }, (entries: PerformanceEntry[], observer: PerformanceObserver) => {})`
  - `getEntriesByType(type: string) => Promise<PerformanceEntry[]>`
- Custom metrics:
  - `time(label: string)` + `timeEnd(label: string)` or `timeEndPaint(label: string, callback: function)`
  - `mark(markName: string)` + `measure(measureName: string, startMarkName?: string, endMarkName?: string)` + `now()`
- Device:
  - `getDeviceInfo()`

Extra modules:

- API Reporter: `createApiReporter(opts)`
- Google Analytics Reporter: `createGoogleAnalyticsReporter()`
- SPA monitor: `createSpaMonitor(opts)`

## Credits

Carefully crafted at [Treo.sh - Page Speed Monitoring with Lighthouse](https://treo.sh/).

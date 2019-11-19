<p align="center">
  <img width="1045" alt="UXM - User Experience Metrics" src="https://user-images.githubusercontent.com/158189/69014933-46249f80-098f-11ea-98d4-095d112afd56.png">
</p>

<p align="center">
  A tiny (2kb gzip) utility library for collecting<br />
  user-centric performance metrics.
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

```bash
# install using npm
npm install uxm

# or with yarn
yarn add uxm
```

Measure navigation timing (all browsers):

```js
// Features:
// - wait for onload, when necessary or return results immediately
// - precompute useful attributes (cross-browser)
// - return raw `navigation` event when available (Chrome / Firefox)
import { getNavigationTiming } from 'uxm'

const { timeToFirstByte, domContentLoaded, onLoad } = await getNavigationTiming()
```

Measure time:

```js
// Features:
// - better primitives for measuring time & time of the last paint
// - simple UI to observe & collect records
import { time, timeEndPaint, createEventsObserver, geEventsByType } from 'uxm'

// measure actions
time('my-task')
computeIntensiveTask()
timeEnd('my-task')

// collect measures (async)
createEventsObserver('measure', measures => {})

// or get all at once
const allMeasures = await geEventsByType('measure')
```

Integrate with React and track view rendering time (all browsers):

```js
import { useEffect } from 'react'
import { time, timeEndPaint } from 'uxm'

function App() {
  useTime('renderApp')
  return <MoreComponents />
}

// collect measure after the component did mount and all paint events completed
function useTime(label) {
  time(label)
  useEffect(() => timeEndPaint(label), [])
}

// report "measure" to analytics
createEventsObserver('measure', measures => reportToAnalytics(measures))
```

Collect user-centric metrics and send them to google analytics (only Chrome):

```js
// features:
// - implement logic behind collecting and observing metrics
// - fast metric compute
import { createMetricObserver as onMetric } from 'uxm'
import { reportMetric } from 'uxm/google-analytics-reporter'

onMetric('fcp', fcp => reportMetric({ fcp }))
onMetric('fid', fid => reportMetric({ fid }))

// get metrics
const lcp = await getMetricByType('lcp') // immediate compute (fast, without waiting for tab switch or interaction)
const fid = await getMetricByType('fid') // possibly null if no interactions observed
const cls = await getMetricByType('cls') // get cummulative shift up to this point
```

Get device information (only Chrome):

```js
// features:
// - access modern APIs when available
import { getDeviceMemory, getConnectionType, getCpus, getUserAgent } from 'uxm/device'
const device = {
  memory: getDeviceMemory(),
  cpus: getCpus(),
  connectionType: getConnectionType(),
  userAgent: getUserAgent()
}
```

Observe performance events and collect long tasks (only Chrome):

```js
// features:
// - doesn't fail when PerformanceObserver is not available, or event is new
// - always return PO-like object with 2 methods: disconnect & takeRecords
// - normalize event names
import { createEventsObserver } from 'uxm'

// collect longTasks
const longTasks = []
const observer = createEventsObserver('long-task', events => {
  longTasks.push(...events.map(e => e.duration))
})

// extra methods
observer.disconnect() // cancel observation
observer.takeRecords() // flush recent events
```

Get buffered entries and track layout shift between view changes (only Chrome):

```js
// features:
// - return [] when event is unknown or PerformanceObserver is unavailable
// - automatic timeout if no events triggered
// - normalized event names
// - use modern API and fallback to legacy for mark/measure/resource
import { geEventsByType } from 'uxm'

// track latest shift time
let latestStartTime = 0

// filter and compute layout shifts
const layoutShifts = await geEventsByType('layout-shift')
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

- Custom metrics (collect timing)
  - `time(label)`, `timeEnd(label)` or `timeEndPaint(label, [callback])`
  - `mark(markName)`, `measure(measureName, [startMarkName], [endMarkName])`
- Performance observer (build your own metrics)
  - `createEventsObserver(eventType, callback, [options])`
  - `await getEventsByType(eventType)`
- Navigation timing:
  - `await getNavigationTiming()` - timeToFirstByte, domContentLoaded, onLoad (and more useful metrics and complete navigation event)
- Metric observer (Chrome only)
  - `createMetricObserver(metricName, callback)`
  - `await getMetricByType(metricName)`
- Device info (primary Chrome)
  - `getUserAgent()`
  - `getDeviceType()` - phone | tablet | desktop
  - `getDeviceMemory()` - memory size as a scale of 2 (1,2,4,8,16) (Chrome only)
  - `getCpus()` - number of cores (Chrome only)
  - `getConnectionType()` - effective connection type (2g, 3g, 4g) (Chrome only)
- Reporters:
  - `reportToGoogleAnalytics(metrics)`

Events & Metrics:

- event types:
  - `mark`, `measure`, `resource` (all browsers)
  - `navigation` (Chrome + FF)
  - `first-contentful-paint`, `largest-contentful-paint`, `first-input`, `layout-shift`, `long-task`, `element-timing` (Chrome only)
- metric types:
  - `fcp`, `lcp`, `cls`, `fid` (Chrome only)

## Credits

[![Treo.sh - Page speed monitoring with Lighthouse](https://user-images.githubusercontent.com/158189/66038877-a06abd80-e513-11e9-837f-097f44544326.jpg)](https://treo.sh/)

Made with ❤️ at [Treo.sh](https://treo.sh/).

```

```

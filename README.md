<p align="center">
  <img src="./docs/logo.png" />
</p>

<p align="center">
  A tiny (1.5kb gzip) utility library for collecting<br />
  user-centric performance metrics.
</p>

<p align="center">
  <a href="#">Why?</a> • <a href="#usage">Usage</a> • <a href="#api">API</a> • <a href="#credits">Credits</a>
</p>

<br/>
<br/>

...

## Usage

[![](https://img.shields.io/npm/v/uxm.svg)](https://npmjs.org/package/uxm)
[![](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

```bash
npm install uxm
```

## API

### User-centric metrics

https://web.dev/metrics/#important-metrics-to-measure

Subscribe to the core user-centric metrics.

- FCP: metrics.on('first-contentful-paint', fcp => {})
- LCP: metrics.on('largest-contentful-paint', lcp => {})
- FID: metrics.on('first-input-delay', fid => {})
- CLS: metrics.on('cumulative-layout-shift', cls => {})
- await getFirstContentfulPaint() || getFirstInputDelay() || getLargestContentfulPaint() || getCumulativeLayoutShift()

### Custom events

https://web.dev/metrics/#define-your-own-metrics

Subscribe on raw events and build your own metrics.
Use `getEventsByType(type)` to get buffered events.

- events.on('long-task', longTasks => {})
- events.on('element-timing', elementTimings => {})
- events.on('resource', resources => {})
- events.on('layout-shift', layoutShifts => {})
- await getEventsByType('mark' || 'measure' || 'resource' || 'element-timing' || 'layout-shift' || 'long-task', 'navigation', events => {})

Profile your app and build custom metrics

- mark(markName) + measure(measureName, [startMarkName], [endMarkName]) => traditional userTiming
- time(label) + timeEnd(label) || timeEndPaint(label) => trackable constole.time|console.timeEnd, timeEndPaint waits for idle main thread for UI operations
- events.on('measure', measures => {})

### Device info

Sync API to differenciate devices.

- getDeviceMemory()
- getEffectiveConnectionType()
- getHardwareConcurrency()
- getUrl()
- getUserAgent()

### Navigation timing

Async API for back-end monitoring.

- await getTimeToFirstByte()
- await getServerTiming()
- await getDomContentLoaded()
- await getOnLoad()

### `Deprecated` from v1

- `del`: getFirstPaint() - useless, use getFirstContentfulPaint or getEventsByType('paint') and filter `first-paint`
- `del`: getUserTimings() => use getEventsByType('mark') + getEventsByType('measure')
- `del`: getResources() => getEventsByType('resources')
- `del`: getLongTasks() => not buffered yet, later getEventsByType('long-task')
- `del`: uxm(opts) => in favor of explicit config
- `del`: getDeviceType() => better to use real device parsing or an HTTP header from CDN

## Examples

### Basic example

```js
import { metrics } from 'uxm'
import { reportToGoogleAnalytics } from 'uxm/google-analytics-reporter'

// report metrics
metrics
  .on('first-contentful-paint', fcp => reportToGoogleAnalytics({ fcp })
  .on('largest-contentful-paint', lcp => reportToGoogleAnalytics({ lcp }))
  .on('first-input-delay', fid => reportToGoogleAnalytics({ fid }))
  .on('cumulative-layout-shift', cls => reportToGoogleAnalytics({ cls }))
```

### CrUX-like metrics

```js
import {
  getTimeToFirstByte,
  getFirstContentfulPaint,
  getDomContentLoaded,
  getOnLoad,
  metrics,
  getHardwareConcurrency,
  getEffectiveConnectionType,
  getDeviceMemory,
  getUrl
} from 'uxm'
// later, track sessionId and debounce events
import { reportMetrics } from 'uxm/api-reporter'

const loadMetrics = {
  ttfb: await getTimeToFirstByte(),
  fcp: await getFirstContentfulPaint(),
  dcl: await getDomContentLoaded(),
  ol: await getOnLoad()
}

const device = {
  effectiveConnectionType: getEffectiveConnectionType(),
  url: getUrl()
}

reportMetrics({ ...loadMetrics, ...device })

// report delayed metrics
metrics
  .on('largest-contentful-paint', lcp => reportMetrics({ lcp }))
  .on('first-input-delay', fid => reportMetrics({ fid }))
  .on('cumulative-layout-shift', cls => reportMetrics({ cls }))
```

### SPA Monitoring

```js
import { observer, time, timeEnd, timeEndPaint } from 'uxm'

// collect CrUX metrics like in prev example
// ...
// observe SPA events
observer.on('measures', measures => reportEvents('measures', parseMeasures(measures))) // ignore <1s
observer.on('long-tasks', longTasks => reportEvents('longTasks', parseLongTasks(longTasks))) // use only duration
observer.on('resources', resources => reportEvents('resources', parseResources(resources))) // only XHR
observer.on('layout-shifts', layoutShifts => reportEvents('layoutShifts', parseLayoutShifts(layoutShifts))) // round to % & only values

// track performance with custom metrics
time('render')
await render() // perform UI render
timeEndPaint('render') // report only after all the paints finished

time('compute')
computeSomething() // perform heavy compute and track exact time
timeEnd('compute') // report it, use time & timeEnd as trackable console.time + console.timeEnd
```

### React

```js
// from
import { useEffect } from 'react'
import { time, timeEndPaint } from 'uxm'

export const App = () => {
  time('renderApp')
  useEffect(() => {
    timeEndPaint('renderApp')
  }, [])
  return <div className="app">Hello</div>
}

// or:
import { useTime } from 'uxm/react'

export const App = () => {
  useTime('renderApp')
  return <div className="app">Hello</div>
}

function useTime(label) {
  time(label)
  useEffect(() => {
    timeEndPaint(label) // wait for the paint
  }, []) // only once
}

// report "measures" to analytics
observer.on('measures', (measures) => reportEvents(measures))
```

## Credits

[![Treo.sh - Page speed monitoring with Lighthouse](https://user-images.githubusercontent.com/158189/66038877-a06abd80-e513-11e9-837f-097f44544326.jpg)](https://treo.sh/)

Made with ❤️ by [Treo.sh](https://treo.sh/).

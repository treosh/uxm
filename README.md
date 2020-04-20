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

**Features**:

- Modular design based on ES modules.
- Small size (2.5kb gzip). It's usually smaller when you use a few features and [Tree Shaking](https://webpack.js.org/guides/tree-shaking/).
- Graceful support of latest browser APIs like [Performance Paint Timing](https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming), [Network Information](https://wicg.github.io/netinfo/), or [Device Memory](https://w3c.github.io/device-memory/).
- Fully featured [User Timing API v3](https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API) support.

## Usage

[![](https://img.shields.io/npm/v/uxm.svg)](https://npmjs.org/package/uxm)
[![](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

```bash
npm install uxm@next
```

Collect [user-centric metrics](https://web.dev/metrics/) and send data to your API (1.5Kb):

```js
import { collectMetrics, createApiReporter, getDeviceInfo } from 'uxm'

const report = createApiReporter('/api/collect', { initial: getDeviceInfo() })

collectMetrics(['fcp', 'lcp', 'fid', 'cls'], ({ metricType, value }) => {
  report({ [metricType]: value })
})
```

At the end of the session (on `visibilitychange` event), your API receives a POST request (using `sendBeacon`) with data for core UX metrics and a device information, like:

```json
{
  "fcp": 1409,
  "fid": 64,
  "lcp": 2690,
  "cls": 0.025,
  "url": "https://example.com/",
  "memory": 8,
  "cpus": 2,
  "connection": { "effectiveType": "4g", "rtt": 150, "downlink": 4.25 }
}
```

Explore examples for building a robust real-user monitoring (RUM) logic. Size of each example is controlled using [size-limit](./package.json#L74).

<details>
  <summary>Report FCP and FID to Google Analytics (0.7 KB)</summary>

Use Google Analytics as a free RUM service, and report user-centric performance metrics.
Learn more about [using Google Analytics for site speed monitoring](https://philipwalton.com/articles/the-google-analytics-setup-i-use-on-every-site-i-build/#performance-tracking).

[`google-analytics-reporter.js`](./examples/google-analytics-reporter.js):

```js
import { collectFcp, collectFid } from 'uxm'

collectFcp(reportToGoogleAnalytics)
collectFid(reportToGoogleAnalytics)

function reportToGoogleAnalytics(metric) {
  ga('send', 'event', {
    eventCategory: 'Performance Metrics',
    eventAction: 'track',
    [metric.metricType]: metric.value,
  })
}
```

</details>

<details>
  <summary>Measure React view render performance (0.65 KB)</summary>

A react-hook example that measures rendering performance and creates a custom [user-timing](https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API) measure.

[`react-use-time-hook.js`](./examples/react-use-time-hook.js):

```js
import { time, timeEndPaint } from 'uxm'

export function App() {
  useTime('render:app')
  return 'Hello from React'
}

function useTime(label) {
  time(label) // render started
  useEffect(() => timeEndPaint(label), []) // render ended, and the browser paint has been procceed.
}
```

</details>

<details>
  <summary>Build a custom layout-shift metric for SPA (0.8 KB)</summary>

[Layout Instability](https://wicg.github.io/layout-instability/) is a flexible API that allows building custom metrics on top — like, measuring cumulative layout shift per view, not the whole session.

[`custom-layout-shift.js`](./examples/custom-layout-shift.js):

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

// observe `history` changes,
// and reset `cls` when a route changes

observeHistory((e) => {
  views.push({ url: e.prevUrl, cls })
  cls = 0
})
```

</details>

<details>
  <summary>Collect CrUX-like metrics (1.6Kb)</summary>

[Chrome UX Report (CrUX)](https://developers.google.com/web/tools/chrome-user-experience-report/) is a great way to see
how real-world Chrome users experience the speed of your website. But for privacy reasons, CrUX aggregates data only per origin.

This script collects detailed crux-like analytics on the URL level.

[`crux-metrics.js`](./examples/crux-metrics.js):

```js
import { getDeviceInfo, collectLoad, collectFcp, collectLcp, collectFid, collectCls, onVisibilityChange } from 'uxm'

// init `metrics` and get device information

const { connection, url } = getDeviceInfo()
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
  //  {
  //    "url": "https://example.com/",
  //    "effectiveConnectionType": "4g",
  //    "timeToFirstByte": 1204,
  //    "domContentLoaded": 1698,
  //    "load": 2508
  //    "firstContentfulPaint": 1646,
  //    "largestContentfulPaint": 3420,
  //    "firstInputDelay": 12,
  //    "cumulativeLayoutShift": 0.12,
  //  }
}, 1)
```

</details>

## API

- [Metrics](#metrics)
  - [collectMetrics(metrics, callback)](#collectmetricsmetrics-callback)
  - [collectFcp(callback)](#collectfcpcallback)
  - [collectFid(callback)](#collectfidcallback)
  - [collectLcp(callback, [options])](#collectlcpcallback-options)
  - [collectCls(callback, [options])](#collectclscallback-options)
  - [collectLoad(callback)](#collectloadcallback)
- [Performance Observer](#performance-observer)
  - [observeEntries(options, callback)](#)
  - [getEntriesByType(entryType)](#)
  - [onVisibilityChange(callback)](#)
  - [onLoad(callback)](#)
- [Reporter](#reporter)
  - [createApiReporter(url, [options])](#)
  - [getDeviceInfo()](#)
- [User-timing](#user-timing)
  - [mark(markName, [markOptions])](#)
  - [measure(markName, [startOrMeasureOptions], [endMarkName])](#)
  - [time(label, [startLabel])](#)
  - [timeEnd(label, [startLabel])](#)
  - [timeEndPaint(label, [startLabel])](#)
  - [now()](#)
- [Experimental (`alpha`)](#experimental-alpha)
  - [collectCid(callback)](#)
  - [observeHistory(callback)](#)
  - [recordTrace(callback, [options])](#)
  - [calcSpeedScore(values, [ranks])](#)

### Metrics

Metrics are the core of `uxm` (`uxm` is a 3-letter acronym that stands for User eXperience Metrics).

It focuses on metrics, that captures a user experience, instead of measuring technical details, that are easy to manipulate.
This metrics are more representetive for a user, and the final purpose of a good frontend is to create a delightful user experience.

Each metric follows the structure:

- `metricType` <[string]> - a metric acronym, ex: `lcp`, `fid`, or `cls`.
- `value` <[number]> - a numeric value of a metric, ex: `1804` for `lcp`, `4` for `fid`, or `0.129` for `cls`.
- `detail` <[object]> - an extra detail specific for an each metric, like `elementSelector` for `lcp`, event `name` for `fid`, or `totalEntries` for `cls`.

with an exception for `collectLoad` (it does not have a 3-letters acronym, and considered a legacy.)
Use a per-metric function for more granular control of the callback behavior and saving a bundle size.

This metrics are only available in Chromium-based browsers (Chrome, Edge, Opera).

The best way to understand a metric is to read web.dev/metrics and check [the source](./src/metrics.js).

#### collectMetrics(metrics, callback)

- `metrics` <[array]<[string]|[object]>>
- `callback` <[function]>

The method is a shortcut for calling [`collectFcp`](#collectfcpcallback), [`collectFid`](#collectfidcallback), [`collectLcp`](#collectlcpcallback-options), and [`collectCls`](#collectclscallback-options).

```js
import { collectMetrics } from 'uxm'

const report = createApiReporter('/api/collect')

// pass a metric 3-letter acronym
collectMetrics(['fcp', 'fid'], (metric) => {
  report({ [metric.metricType]: metric.value })
})

// or a metric options using an object and `type`
collectMetrics([{ type: 'lcp', maxTimeout: 1000 }], (metric) => {
  report({ lcp: metric.value })
})
```

#### collectFcp(callback)

- `callback` <[function]> a callback with FcpMetric:
  - `metricType` <`"fcp"`>
  - `value` <[number]> a time when the user can see anything on the screen – a fast FCP helps reassure the user that something is **happening**.

Collect [First Contentful Paint (FCP)](https://web.dev/fcp/) using [`paint`](https://www.w3.org/TR/paint-timing/) entries.

#### collectFid(callback)

- `callback` <[function]> a callback with `FidMetric`:
  - `metricType` <`"fid"`>
  - `value` <[number]>
  - `detail` <[object]>
    - `name` <[string]>
    - `duration` <[number]>
    - `startTime` <[number]>
    - `processingStart` <[number]>
    - `processingEnd` <[number]>

```js
import { collectFid } from 'uxm'

collectFid((metric) => {
  console.log(metric)
  // { metricType: "fid", value: 1, detail: { duration: 8, startTime: 2568.1, processingStart: 2568.99, processingEnd: 2569.02, name: "mousedown" }
})
```

#### collectLcp(callback, [options])

- `callback` <[function]> a callback with `LcpMetric`:
  - `metricType` <`"lcp"`>
  - `value` <[number]> a time when the page's main content has likely loaded – a fast LCP helps reassure the user that the page is **useful**.
  - `detail` <[object]>
    - `elementSelector` <[string]> CSS selector of an element, that is triggered the most significant paint
    - `size` <[number]> size (`height` x `width`) of the largest element
- `options` <[object]> (Optional)
  - `maxTimeout` <[number]> The longest delay between `largest-contentful-paint` entries to consider the LCP. Defaults to `10000` ms.

Collect [Largest Contentful Paint (LCP)](https://web.dev/lcp/) using [`largest-contentful-paint`](https://wicg.github.io/largest-contentful-paint/) entries.
A callback triggers when a user interacts with a page, or after `maxTimeout` between entries, or on `"visibilitychange"` event.

```js
import { collectLcp } from 'uxm'

collectLcp((metric) => {
  console.log(metric) // { metricType: "lcp", value: 2450, detail: { size: 8620, elementSelector: "body > h1" } }
})
```

#### collectCls(callback, [options])

- `callback` <[function]> a callback with `ClsMetric`:
  - `metricType` <`"cls"`>
  - `value` <[number]>
  - `detail` <[object]>
    - `totalEntries` <[number]>
    - `sessionDuration` <[number]>

```js
import { collectCls } from 'uxm'

collectCls(
  (metric) => {
    console.log(metric) // { metricType: "cls", value: 0.0893, detail: { totalEntries: 2, sessionDuration: 2417 } }
  },
  { maxTimeout: 1000 }
)
```

#### collectLoad(callback)

- `callback` <[function]> a callback with `ClsMetric`:
  - `metricType` <`"load"`>
  - `value` <[number]>
  - `detail` <[object]>
    - `timeToFirstByte` <[number]>
    - `domContentLoaded` <[number]>

```js
import { collectLoad } from 'uxm'

collectLoad(({ value: load, detail: { domContentLoaded, timeToFirstByte } }) => {
  console.log({ timeToFirstByte, domContentLoaded, load })
})
```

### Performance Observer

#### observeEntries(options, callback)

#### getEntriesByType(entryType)

### Reporter

#### createApiReporter(url, [options])

### User Timing

#### mark(markName, [markOptions])

#### measure(markName, [startOrMeasureOptions], [endMarkName])

#### time(label, [startLabel])

#### timeEnd(label, [startLabel])

#### timeEndPaint(label, [startLabel])

#### now()

### Device Info

#### getDeviceInfo()

### Experimental (`alpha`)

#### collectCid(callback)

#### observeHistory(callback)

#### recordTrace(callback, [options])

#### calcSpeedScore(values, [ranks])

---

### Credits

Made with ❤️ by [Treo](https://treo.sh/).

[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array 'Array'
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function 'Function'
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type 'Number'
[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object 'Object'

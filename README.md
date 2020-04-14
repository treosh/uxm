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

At the end of the session (on "visibilitychange" event),
your API will receive a POST request (`sendBeacon`) with data with main UX metrics, and an anonymous device information: {
fcp: 1409, fid: 64, lcp: 2690, cls: 0.025, url: 'https://example.com/',
memory: 8, cpus: 8, connection: { effectiveType: '4g', rtt: 150, downlink: 4.25 }
}

Explore examples for building a robust real-user monitoring (RUM) logic:

<details>
 <summary>Measure React view render performance (0.65 KB, [example](./examples/react-view-render-hook.js)).</summary><br>

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

</details>

<details>
 <summary>Build custom layout-shifts metrics for each SPA view (0.8 KB, [example](./examples/layout-shift-per-view.js)).</summary><br>

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

</details>

<details>
 <summary>Collect rendering metrics (FCP/LCP) to google analytics (1 KB, [example](./examples/google-analytics-reporter.js)).</summary><br>

Learn more about [using google analytics for site speed monitoring](https://philipwalton.com/articles/the-google-analytics-setup-i-use-on-every-site-i-build/#performance-tracking)

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

</details>

<details>
 <summary>Collect [CrUX-like metrics](https://developers.google.com/web/tools/chrome-user-experience-report/) (1.55Kb, [example](./examples/crux-like-metrics.js)).</summary><br>

```js
import { getDeviceInfo, collectLoad, collectFcp, collectLcp, collectFid, collectCls } from 'uxm'

// init `metrics` and get device information

const { connection } = getDeviceInfo()
const metrics = { effectiveConnectionType: connection.effectiveType }

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

console.log(metrics)
//  {
//    "effectiveConnectionType": "4g",
//    "timeToFirstByte": 1204,
//    "domContentLoaded": 1698,
//    "load": 2508
//    "firstContentfulPaint": 1646,
//    "largestContentfulPaint": 3420,
//    "firstInputDelay": 12,
//    "cumulativeLayoutShift": 0.12,
//  }
```

</details>

Size of each example is controlled using [size-limit](./package.json#L74).

## API

- [Metrics](#metrics)
  - [collectMetrics(metrics, callback)](#collectmetricsmetrics-callback)
  - [collectFcp(callback)](#collectfcpcallback)
  - [collectFid(callback)](#collectfidcallback)
  - [collectLcp(callback, [options])](#collectlcpcallback-options)
  - [collectCls(callback, [options])](#collectclscallback-options)
  - [collectLoad(callback)](#collectloadcallback)
- [Reporter](#reporter)
  - [createApiReporter(url, [options])](#)
  - [getDeviceInfo()](#)
  - [onVisibilityChange(callback)](#)
  - [onLoad(callback)](#)
- [Performance Observer](#performance-observer)
  - [observeEntries(options, callback)](#)
  - [getEntriesByType(entryType)](#)
- [User-timing](#user-timing)
  - [mark(markName, [markOptions])](#)
  - [measure(markName, [startOrMeasureOptions], [endMarkName])](#)
  - [time(label, [startLabel])](#)
  - [timeEnd(label, [startLabel])](#)
  - [timeEndPaint(label, [startLabel])](#)
  - [now()](#)
- [Experimental (`preview`)](#experimental-preview)
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

- `callback` <[function](FcpMetric)>

#### collectFid(callback)

- `callback` <[function](FidMetric)>

#### collectLcp(callback, [options])

- `callback` <[function]> ...:
  - `metricType` <`"lcp"`>
  - `value` <[number]>
  - `detail` <[object]>
    - `size` <[number]>
    - `elementSelector` <[string]>
- `options` <[object]> (Optional).
  - `maxTimeout` <[number]> The longest delay between `largest-contentful-paint` entries to consider the LCP. Defaults to `10000` ms.

Collect [Largest Contentful Paint (LCP)](https://web.dev/lcp/).

> **LCP** is a user-centric metric thst marks the time when the page's main content has likely loaded.
> A fast LCP helps reassure the user that the page is useful.

```js
import { collectLcp } from 'uxm'

collectLcp((metric) => {
  console.log(metric) // { metricType: "lcp", value: 2450, detail: { size: 8620, elementSelector: "body > h1" } }
})
```

#### collectCls(callback, [options])

#### collectLoad(callback)

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

### Experimental (`preview`)

#### collectCid(callback)

#### observeHistory(callback)

#### recordTrace(callback, [options])

#### calcSpeedScore(values, [ranks])

---

### Credits

Made with ❤️ to the open web by [Treo](https://treo.sh/).

[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array 'Array'
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function 'Function'
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type 'Number'
[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object 'Object'

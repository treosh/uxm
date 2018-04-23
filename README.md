<p align="center">
  <img src="./docs/logo.png" />
</p>

<p align="center">
  An utility library for collecting web performance metrics<br />
  that affect user experience.
</p>

<p align="center">
  <a href="#">Why?</a> • <a href="#example">Usage</a> • <a href="#api">API</a> • <a href="#credits">Credits</a>
</p>

<br/>
<br/>

Modern web platform provides a lot of APIs to analyze page speed information.
But it's hard to follow them and even harder to deal with the lack of implementation in different browsers.

UXM is a modular library that allows to combine various functions and collect the data you need. Think about it, as [Lodash](https://lodash.com/) for user experience APIs.

**Use cases**:

* Build private version of [Chrome User Experience Report](https://developers.google.com/web/tools/chrome-user-experience-report/).
* Collect RUM data.
* Audit the page performance using Puppeteer ([example](./test/index.js)).
* Dynamically evaluate performance of the user's browser and adapt your app.

**Features**:

* Modular design based on ES modules.
* Small size (1kb gzip). It's usually smaller, if you remove unused functions using [Tree Shaking](https://webpack.js.org/guides/tree-shaking/).
* Graceful support of latest browser APIs like [Performance Paint Timing](https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming), [Network Information](https://wicg.github.io/netinfo/), or [Device Memory](https://w3c.github.io/device-memory/).
* Fully featured [User Timing](https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API) metrics.
* Lightweight device type parser.
* [Long Tasks](https://www.w3.org/TR/longtasks/)

## Usage

Install using yarn/npm:

```bash
yarn add uxm
npm i -S uxm
```

Import `uxm` and call it in the end of the page loading:

default metrics structure base on Chrome User Experience Report

```js
import { uxm } from 'uxm'

uxm().then(metrics => {  
  {
    "deviceType": "desktop",
    "effectiveConnectionType": "4g",
    "firstPaint": 1646,
    "firstContentfulPaint": 1646,
    "domContentLoaded": 1698,
    "onLoad": 2508
  }
})
```

Collect just 2 performance metrics associated with `url`:

```js
import { getUrl, getFirstContentfulPaint, getDomContentLoaded } from 'uxm'

const firstScreenMetrics = {
  url: getUrl(),
  fcp: getFirstContentfulPaint(),
  dcl: getDomContentLoaded()
}
```

Analyze current device and connection:

```js
import { getDeviceType, getDeviceMemory, getEffectiveConnectionType } from 'uxm'

const device = {
  type: getDeviceType(),
  memory: getDeviceMemory(),
  connection: getEffectiveConnectionType()
}
```

## API

An API is designed in the way that you can combine different functions and collect the data you need.

### uxm(opts = {})

Returns a `Promise` that resolves after `onLoad` event triggered.
A default set of metrics is defined by [Chrome User Experience Report](https://developers.google.com/web/tools/chrome-user-experience-report/)

Options:

* `all`
* `url`, `userAgent`, `deviceMemory`, `userTiming`, `longTasks`, `resources`

```js
{
  "deviceType": "phone",
  "effectiveConnectionType": "4g",
  "firstPaint": 531,
  "firstContentfulPaint": 531,
  "domContentLoaded": 768,
  "onLoad": 1317,
  "url": "https://www.booking.com/",
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1",
  "deviceMemory": "full",
  "userTiming": [
    {
      "type": "measure",
      "name": "b-stylesheets",
      "startTime": 0,
      "duration": 436
    },
    ...
  ],
  "longTasks": [
    {
      "startTime": 587,
      "duration": 79
    },
    ...
  ],
  "resources": [
    {
      "url": "https://booking.com/",
      "type": "navigation",
      "size": 77953,
      "startTime": 0,
      "duration": 1568
    },
    {
      "url": "https://q-ec.bstatic.com/mobile/css/core_not_critical_edgecast.iq_ltr/404eb9f7184038c4e021715dae9f30db076b90de.css",
      "type": "link",
      "size": 54196,
      "startTime": 430,
      "duration": 61
    },
    ...
  ]
}
```

### mark(markName)

### measure(measureName, [startMarkName])

### getUserTiming()

### getFirstPaint()

### getFirstContentfulPaint()

### getDomContentLoaded()

### getOnLoad()

### getDeviceType()

### getEffectiveConnectionType()

### getDeviceMemory()

### getUrl()

### getUserAgent()

### getResources()

### getLongTasks()

```html
<script>
!function(){if('PerformanceLongTaskTiming' in window){var g=window.__lt={e:[]};
g.o=new PerformanceObserver(function(l){g.e=g.e.concat(l.getEntries())});
g.o.observe({entryTypes:['longtask']})}}();
</script>
```

## Credits

Sponsored by [Treo.sh - Page speed monitoring made easy](https://treo.sh).

[![](https://travis-ci.org/treosh/uxm.png)](https://travis-ci.org/treosh/uxm)
[![](https://img.shields.io/npm/v/uxm.svg)](https://npmjs.org/package/uxm)
[![](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

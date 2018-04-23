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

* Collect RUM data.
* Build private version of [Chrome User Experience Report](https://developers.google.com/web/tools/chrome-user-experience-report/).
* Audit the page performance using Puppeteer ([example](./test/index.js)).
* Dynamically evaluate performance of the user's browser and adapt your app.

**Features**:

* Modular design based on ES modules.
* Small size (1kb gzip). It's usually smaller, if you remove unused functions using [Tree Shaking](https://webpack.js.org/guides/tree-shaking/).
* Graceful support of latest browser APIs like [Performance Paint Timing](https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming), [Network Information](https://wicg.github.io/netinfo/), or [Device Memory](https://w3c.github.io/device-memory/).
* Fully featured [User Timing API](https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API) support.
* Lightweight device type parser.
* Experimental [Long Tasks](https://www.w3.org/TR/longtasks/) support for interactivity metrics.

## Usage

Install using yarn/npm:

```bash
yarn add uxm
npm i -S uxm
```

Import `uxm` and call it in the end of the page loading to collect [CrUX like data](https://developers.google.com/web/tools/chrome-user-experience-report/):

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

const metrics = {
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
A default set of metrics is defined by [Chrome User Experience Report](https://developers.google.com/web/tools/chrome-user-experience-report/), but you can customize them using options (`url`, `userAgent`, `deviceMemory`, `userTiming`, `longTasks`, `resources`).

Pass `all` to get the full report:

```js
import { uxm } from 'uxm'

uxm({ all: true }).then(metrics => {  
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
      ...
    ]
  }
})
```

### mark(markName)

Create [User Timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance/mark) mark to mark important loading event. Convenient shortcut for `window.performance.mark`.

```js
import { mark } from 'uxm'

mark('page load started')
// ...
mark('hero image displayed')
// ...
mark('page fully loaded')
```

### measure(measureName, [startMarkName])

Create [User Timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance/mark) measure to evaluate timing between 2 marks.
Convenient shortcut for `window.performance.measure`.

```js
import { mark, measure } from 'uxm'

mark('start load fonts')
// ...
measure('fonts loaded', 'start load fonts')
```

### getUserTiming()

Returns an array with collected performance marks/measures. Each item contains:

* `type` - "mark" or "measure"
* `name` - unique name
* `startTime` - start time since page load
* `duration` - measure duration

Example response:

```json
[
  {
    "type": "mark",
    "name": "boot",
    "startTime": 1958
  },
  {
    "type": "measure",
    "name": "page did mount",
    "startTime": 1958,
    "duration": 197
  }
]
```

### getFirstContentfulPaint()

Returns the time when first paint which includes text, image (including background images), non-white canvas, or SVG happened.
[W3C draft for Paint Timing 1](https://w3c.github.io/paint-timing).

### getFirstPaint()

Similar to `getFirstContentfulPaint` but different when First Paint has no content.

### getDomContentLoaded()

Returns the time when [`DOMContentLoaded` event](https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded) was fired.

### getOnLoad()

Returns the time when [`load` event](https://developer.mozilla.org/en-US/docs/Web/Events/load) was fired.

### getDeviceType()

Returns "phone", "tablet", or "desktop" using lightweight, [heavy-tested]('./test/device.js') the User-Agent parser.

### getEffectiveConnectionType()

Returns the effective connection type (“slow-2g”, “2g”, “3g”, “4g”) string as determined by round-trip and bandwidth values.
[W3C draft for Network Information API](http://wicg.github.io/netinfo/).

### getDeviceMemory()

Returns "full" or "lite" string, depends if available memory is bigger than 1 GB.
Learn more about [Device Memory](https://developers.google.com/web/updates/2017/12/device-memory).

### getUrl()

Returns a current page URL. Convenient shortcut for `window.location.href`.

### getUserAgent()

Returns a User-Agent string. Convenient shortcut for `window.navigator.userAgent`.

### getResources()

Returns an array with performance information for each resource on the page. Each item contains:

* `url` - resource URL
* `type` - one of types: "navigation", "link", "img", "script", "xmlhttprequest", "font"
* `size` - transferred size in bytes
* `startTime` - when load started
* `duration` - loading time in milliseconds

Example response:

```json
[
  {
    "url": "https://booking.com/",
    "type": "navigation",
    "size": 79263,
    "startTime": 0,
    "duration": 1821
  },
  {
    "url": "https://q-fa.bstatic.com/mobile/css/core_not_critical_fastly.iq_ltr/8051b1d9fafb2e6339aea397447edfded9320dbb.css",
    "type": "link",
    "size": 54112,
    "startTime": 515,
    "duration": 183
  },
  {
    "url": "https://r-fa.bstatic.com/mobile/images/hotelMarkerImgLoader/211f81a092a43bf96fc2a7b1dff37e5bc08fbbbf.gif",
    "type": "img",
    "size": 2295,
    "startTime": 657,
    "duration": 181
  },
  {
    "url": "https://r-fa.bstatic.com/static/js/error_catcher_bec_fastly/ba8921972cc55fbf270bafe168450dd34597d5a1.js",
    "type": "script",
    "size": 2495,
    "startTime": 821,
    "duration": 43
  },
  ...
]
```

### getLongTasks()

Returns an array of `{ startTime, duration }` pairs.
Until `buffered` flag supported, you need to add this script to the `<head />` in order to collect all Long Tasks:

```html
<script>
!function(){if('PerformanceLongTaskTiming' in window){var g=window.__lt={e:[]};
g.o=new PerformanceObserver(function(l){g.e=g.e.concat(l.getEntries())});
g.o.observe({entryTypes:['longtask']})}}();
</script>
```

And then get them using:

```js
import { getLongTasks } from 'uxm'
getLongTasks() // [{"startTime": 672, "duration": 84}, {"startTime": 931, "duration": 84}, {"startTime": 1137, "duration": 135}]
```

Learn more about [Long Tasks](https://calendar.perfplanet.com/2017/tracking-cpu-with-long-tasks-api/).

## Credits

Sponsored by [Treo.sh - Page speed monitoring made easy](https://treo.sh).

[![](https://travis-ci.org/treosh/uxm.png)](https://travis-ci.org/treosh/uxm)
[![](https://img.shields.io/npm/v/uxm.svg)](https://npmjs.org/package/uxm)
[![](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

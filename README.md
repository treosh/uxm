<p align="center">
  <a href="#"><img src="./docs/logo.png" /></a>
</p>

<p align="center">
  An utility library for collecting web performance metrics<br />
  that affect user experience.
</p>
<br/>
<br/>

<p align="center">
  <a href="#example">Usage</a> •
  <a href="#why">Why?</a> •
  <a href="#principles">API</a>
</p>

<br/>
<br/>

...

# UXM (User Experience Metrics)

>

1 Kb size
Motivation:
Features:
https://developers.google.com/web/tools/chrome-user-experience-report/

## Usage

```js
import { uxm, mark } from 'uxm'

//
mark('page is visible')

// collect analytics in the end of loading
uxm().then(metrics => {  
  // typical response:
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

## API

### uxm(opts = {})

### mark(markName)

### measure(measureName, [startMarkName])

### getUserTiming()

### getFirstPaint()

### getFirstContentfulPaint()

### getDomContentLoaded()

### getOnLoad()

### getEffectiveConnectionType()

### getDeviceType()

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

---

Sponsored by [Treo.sh - Page speed monitoring made easy](https://treo.sh).

[![](https://travis-ci.org/treosh/uxm.png)](https://travis-ci.org/treosh/uxm)
[![](https://img.shields.io/npm/v/uxm.svg)](https://npmjs.org/package/uxm)
[![](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

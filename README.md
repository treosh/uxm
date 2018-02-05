# uxm

> UXM (User Experience Metrics) - the key web performance metrics.

## Example

```js
import { metrics } from 'uxm'

// ... load the page and all scripts
// execute metrics in the end to collect web performance information.
metrics()

{
  "deviceType": "desktop",
  "deviceMemory": 8,
  "connection": {
    "rtt": 0,
    "downlink": 10,
    "effectiveType": "4g"
  },
  "metrics": {
    "firstPaint": 1397,
    "firstContentfulPaint": 1397,
    "onLoad": 2075,
    "domContentLoaded": 1453
  },
  "marks": {},
  "measures": {
    "b-stylesheets": 870,
    "b-pre-scripts": 1690,
    "b-post-scripts": 1908
  }
}
```

## Long Tasks

```html
<script>
!function(){if('PerformanceLongTaskTiming' in window){var g=window.__lt={e:[]};
g.o=new PerformanceObserver(function(l){g.e=g.e.concat(l.getEntries())});
g.o.observe({entryTypes:['longtask']})}}();
</script>
```

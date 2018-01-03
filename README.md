# uxm

> User Experience Metrics

## Example

```js
import { metrics } from 'uxm'

// ... load the page and all scripts
// execute metrics in the end to collect web performance information.
metrics()

{
  "effectiveConnectionType": "4g",
  "metrics": {
    "firstPaint": 1592,
    "firstContentfulPaint": 1592,
    "onLoad": 2076,
    "domContentLoaded": 1482
  },
  "now": 2736,
  "marks": {},
  "measures": {
    "b-stylesheets": 1057,
    "b-pre-scripts": 1870,
    "b-post-scripts": 2089
  }
}
```

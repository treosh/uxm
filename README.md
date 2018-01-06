# uxm

> User Experience Metrics

## Example

```js
import { metrics } from 'uxm'

// ... load the page and all scripts
// execute metrics in the end to collect web performance information.
metrics()

{
  "device": {
    "type": "desktop",
    "memory": "full",
    "effectiveConnectionType": "4g"
  },
  "metrics": {
    "firstPaint": 1502,
    "firstContentfulPaint": 1502,
    "onLoad": 2105,
    "domContentLoaded": 1516
  },
  "marks": {},
  "measures": {
    "b-stylesheets": 1005,
    "b-pre-scripts": 1767,
    "b-post-scripts": 2011
  }
}
```

# uxm

> User Experience Metrics

## Example

```js
import { metrics } from 'uxm'

// ... load the page and all scripts
// execute metrics in the end to collect web performance information.
metrics()

{
  "deviceMemory": "full",
  "effectiveConnectionType": "4g",
  "metrics": {
    "firstPaint": 1342,
    "firstContentfulPaint": 1342,
    "onLoad": 5922,
    "domContentLoaded": 1332
  },
  "marks": {},
  "measures": {
    "b-stylesheets": 1121,
    "b-pre-scripts": 1573,
    "b-post-scripts": 1850
  }
}
```

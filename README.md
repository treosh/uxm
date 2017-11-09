# uxm

> User Experience Metrics

## Examples

```js
import { metrics } from 'uxm'

// ... load the page and all scripts
// execute metrics in the end to collect web performance information.
metrics()

{
  "effectiveConnectionType": "4g",
  "metrics": {
    "firstPaint": 3851,
    "firstContentfulPaint": 3851,
    "firstInteractive": 7050,
    "onLoad": 6940,
    "domContentLoaded": 3840
  },
  "customMetrics": {
    "b-pre-scripts": 3896,
    "b-stylesheets": 3762,
    "b-post-scripts": 6916
  }
}
```

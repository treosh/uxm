export function metrics(opts = {}) {
  return {
    connectionType: '',
    metrics: {
      'first-paint': 0,
      'first-contentful-paint': 0,
      'first-interactive': 0
    },
    'custom-metrics': {}
  }
}

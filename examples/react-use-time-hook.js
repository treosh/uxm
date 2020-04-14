import { time, timeEndPaint } from '..'

export function App() {
  useView('app')
  return 'Hello from React'
}

function useView(viewName) {
  const label = `render:${viewName}`
  time(label)
  useEffect(() => timeEndPaint(label), [])
}

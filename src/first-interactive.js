// thanks to
// https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/gather/computed/first-interactive.js

const LONG_TASK_THRESHOLD = 50
const MAX_TASK_CLUSTER_DURATION = 250
const MIN_TASK_CLUSTER_PADDING = 1000
const MIN_TASK_CLUSTER_FMP_DISTANCE = 5000
const EXPONENTIATION_COEFFICIENT = -Math.log(3 - 1) / 15

export function getFirstInteractive({ firstContentfulPaint: fmp, domContentLoaded: dcl, longTasks }) {
  if (!fmp || !dcl || !longTasks) return null
  const traceEnd = Infinity
  const longTasksAfterFmp = longTasks
    .filter(evt => evt.duration >= LONG_TASK_THRESHOLD && evt.startTime >= fmp)
    .map(t => ({ start: t.startTime, duration: t.duration, end: t.startTime + t.duration }))

  const fi = findQuietWindow(fmp, traceEnd, longTasksAfterFmp)
  return Math.max(fi, dcl)
}

// Finds the timeInMs of the start of the first quiet window as defined by the firstInteractive
// conditions above. Throws an error if no acceptable quiet window could be found before the end of the trace.

function findQuietWindow(fmp, traceEnd, longTasks) {
  // If we have an empty window at the very beginning, just return FMP early
  if (longTasks.length === 0 || longTasks[0].start > fmp + getRequiredWindowSizeInMs(0)) {
    return fmp
  }

  const isTooCloseToFmp = cluster => cluster.start < fmp + MIN_TASK_CLUSTER_FMP_DISTANCE
  const isTooLong = cluster => cluster.duration > MAX_TASK_CLUSTER_DURATION
  const isBadCluster = cluster => isTooCloseToFmp(cluster) || isTooLong(cluster)

  // FirstInteractive must start at the end of a long task, consider each long task and
  // examine the window that follows it.
  for (let i = 0; i < longTasks.length; i++) {
    const windowStart = longTasks[i].end
    const windowSize = getRequiredWindowSizeInMs(windowStart - fmp)
    const windowEnd = windowStart + windowSize

    // Check that we have a long enough trace
    if (windowEnd > traceEnd) {
      return null
    }

    // Check that this task isn't the beginning of a cluster
    if (i + 1 < longTasks.length && longTasks[i + 1].start - windowStart <= MIN_TASK_CLUSTER_PADDING) {
      continue
    }

    const taskClusters = getTaskClustersInWindow(longTasks, i + 1, windowEnd)
    const hasBadTaskClusters = taskClusters.some(isBadCluster)

    if (!hasBadTaskClusters) {
      return windowStart
    }
  }

  return null
}

function getRequiredWindowSizeInMs(t) {
  const tInSeconds = t / 1000
  const exponentiationComponent = Math.exp(EXPONENTIATION_COEFFICIENT * tInSeconds)
  return (4 * exponentiationComponent + 1) * 1000
}

function getTaskClustersInWindow(tasks, startIndex, windowEnd) {
  const clusters = []

  let previousTaskEndTime = -Infinity
  let currentCluster = null

  // Examine all tasks that could possibly be part of a cluster starting before windowEnd.
  // Consider the case where window end is 15s, there's a 100ms task from 14.9-15s and a 500ms
  // task from 15.5-16s, we need that later task to be clustered with the first so we can properly
  // identify that main thread isn't quiet.
  const clusteringWindowEnd = windowEnd + MIN_TASK_CLUSTER_PADDING
  const isInClusteringWindow = task => task.start < clusteringWindowEnd
  for (let i = startIndex; i < tasks.length; i++) {
    if (!isInClusteringWindow(tasks[i])) {
      break
    }

    const task = tasks[i]

    // if enough time has elapsed, we'll create a new cluster
    if (task.start - previousTaskEndTime > MIN_TASK_CLUSTER_PADDING) {
      currentCluster = []
      clusters.push(currentCluster)
    }

    currentCluster.push(task)
    previousTaskEndTime = task.end
  }

  return (
    clusters
      // add some useful information about the cluster
      .map(tasks => {
        const start = tasks[0].start
        const end = tasks[tasks.length - 1].end
        const duration = end - start
        return { start, end, duration }
      })
      // filter out clusters that started after the window because of our clusteringWindowEnd
      .filter(cluster => cluster.start < windowEnd)
  )
}

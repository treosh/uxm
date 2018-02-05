import { getFirstContentfulPaint, getDomContentLoaded } from './index'
const perf = typeof window !== 'undefined' ? window.performance : null

// experimental

export function getResources() {
  if (!perf || typeof PerformanceResourceTiming === 'undefined') return null
  const documentEntry = { type: 'document', startTime: 0, duration: perf.timing.responseEnd - perf.timing.fetchStart }
  return [documentEntry].concat(
    perf.getEntriesByType('resource').map(resource => ({
      type: resource.initiatorType,
      size: resource.transferSize,
      startTime: Math.round(resource.startTime),
      duration: Math.round(resource.duration)
    }))
  )
}

export function getLongTasks() {
  if (typeof window.__lt === 'undefined') return null
  return window.__lt.e.map(longTask => ({
    startTime: Math.round(longTask.startTime),
    duration: Math.round(longTask.duration)
  }))
}

// based on
// https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/gather/computed/first-interactive.js

const LONG_TASK_THRESHOLD = 50
const MAX_TASK_CLUSTER_DURATION = 250
const MIN_TASK_CLUSTER_PADDING = 1000
const MIN_TASK_CLUSTER_FMP_DISTANCE = 5000
const EXPONENTIATION_COEFFICIENT = -Math.log(3 - 1) / 15

export function getFirstInteractive() {
  const fcp = getFirstContentfulPaint()
  const dcl = getDomContentLoaded()
  const longTasks = getLongTasks()
  if (!fcp || !dcl || !longTasks) return null
  return Math.max(findQuietWindow(fcp, longTasks), dcl)
}

function findQuietWindow(fcp, longTasks) {
  const longTasksAfterFcp = longTasks.filter(lt => lt.duration >= LONG_TASK_THRESHOLD && lt.startTime >= fcp)
  if (!longTasksAfterFcp.length) return fcp

  const isTooCloseToFcp = cluster => cluster.startTime < fcp + MIN_TASK_CLUSTER_FMP_DISTANCE
  const isTooLong = cluster => cluster.duration > MAX_TASK_CLUSTER_DURATION
  const isBadCluster = cluster => isTooCloseToFcp(cluster) || isTooLong(cluster)

  for (let i = 0; i < longTasksAfterFcp.length; i++) {
    const windowStart = longTasksAfterFcp[i].startTime + longTasksAfterFcp[i].duration
    const windowSize = getRequiredWindowSizeInMs(windowStart - fcp)
    const windowEnd = windowStart + windowSize

    // Check that this task isn't the beginning of a cluster
    if (i + 1 < longTasks.length && longTasks[i + 1].startTime - windowStart <= 1000) continue

    const taskClusters = getTaskClustersInWindow(longTasks, i + 1, windowEnd)
    const hasBadTaskClusters = taskClusters.some(isBadCluster)

    if (!hasBadTaskClusters) return windowStart
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
  const isInClusteringWindow = task => task.startTime < clusteringWindowEnd
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
    previousTaskEndTime = task.startTime + task.duration
  }

  return (
    clusters
      // add some useful information about the cluster
      .map(tasks => {
        const start = tasks[0].startTime
        const end = tasks[tasks.length - 1].startTime + tasks[tasks.length - 1].duration
        const duration = end - start
        return { start, end, duration }
      })
      // filter out clusters that started after the window because of our clusteringWindowEnd
      .filter(cluster => cluster.startTime < windowEnd)
  )
}

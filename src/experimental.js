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
    if (!isInClusteringWindow(tasks[i])) break

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

// Based on:
// https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/audits/consistently-interactive.js

const REQUIRED_QUIET_WINDOW = 5000
const ALLOWED_CONCURRENT_REQUESTS = 2

export function getConsistentlyInteractive() {
  const fcp = getFirstContentfulPaint()
  const dcl = getDomContentLoaded()
  const longTasks = getLongTasks()
  const resources = getResources()
  if (!fcp || !dcl || !longTasks || !resources) return null

  const ci = findOverlappingQuietPeriods(fcp, longTasks, resources)
  return Math.max(ci.cpuQuietPeriod.start, fcp, dcl)
}

function findOverlappingQuietPeriods(fcp, longTasks, resources) {
  const endTime = Infinity
  const isLongEnoughQuietPeriod = period =>
    period.end > fcp + REQUIRED_QUIET_WINDOW && period.end - period.start >= REQUIRED_QUIET_WINDOW

  const networkQuietPeriods = findNetworkQuietPeriods(resources, endTime).filter(isLongEnoughQuietPeriod)
  const cpuQuietPeriods = findCPUQuietPeriods(longTasks, endTime).filter(isLongEnoughQuietPeriod)

  const cpuQueue = cpuQuietPeriods.slice()
  const networkQueue = networkQuietPeriods.slice()

  // We will check for a CPU quiet period contained within a Network quiet period or vice-versa
  let cpuCandidate = cpuQueue.shift()
  let networkCandidate = networkQueue.shift()
  while (cpuCandidate && networkCandidate) {
    if (cpuCandidate.start >= networkCandidate.start) {
      // CPU starts later than network, window must be contained by network or we check the next
      if (networkCandidate.end >= cpuCandidate.start + REQUIRED_QUIET_WINDOW) {
        return {
          cpuQuietPeriod: cpuCandidate,
          networkQuietPeriod: networkCandidate,
          cpuQuietPeriods,
          networkQuietPeriods
        }
      } else {
        networkCandidate = networkQueue.shift()
      }
    } else {
      // Network starts later than CPU, window must be contained by CPU or we check the next
      if (cpuCandidate.end >= networkCandidate.start + REQUIRED_QUIET_WINDOW) {
        return {
          cpuQuietPeriod: cpuCandidate,
          networkQuietPeriod: networkCandidate,
          cpuQuietPeriods,
          networkQuietPeriods
        }
      } else {
        cpuCandidate = cpuQueue.shift()
      }
    }
  }

  return null
}

function findNetworkQuietPeriods(resources, endTime) {
  const timeBoundaries = resources.reduce((memo, record) => {
    memo.push({ time: record.startTime * 1000, isStart: true })
    memo.push({ time: record.startTime + record.duration, isStart: false })
    return memo
  }, [])

  let numInflightRequests = 0
  let quietPeriodStart = 0
  const quietPeriods = []

  timeBoundaries.forEach(boundary => {
    if (boundary.isStart) {
      // we've just started a new request. are we exiting a quiet period?
      if (numInflightRequests === ALLOWED_CONCURRENT_REQUESTS) {
        quietPeriods.push({ start: quietPeriodStart, end: boundary.time })
      }
      numInflightRequests++
    } else {
      numInflightRequests--
      // we've just completed a request. are we entering a quiet period?
      if (numInflightRequests === ALLOWED_CONCURRENT_REQUESTS) {
        quietPeriodStart = boundary.time
      }
    }
  })

  // Check we ended in a quiet period
  if (numInflightRequests <= ALLOWED_CONCURRENT_REQUESTS) {
    quietPeriods.push({ start: quietPeriodStart, end: endTime })
  }

  return quietPeriods
}

function findCPUQuietPeriods(longTasks, endTime) {
  if (longTasks.length === 0) {
    return [{ start: 0, end: endTime }]
  }

  const quietPeriods = []
  longTasks.forEach((task, index) => {
    if (index === 0) {
      quietPeriods.push({ start: 0, end: task.start })
    }

    if (index === longTasks.length - 1) {
      quietPeriods.push({ start: task.startTime + task.duration, end: endTime })
    } else {
      quietPeriods.push({
        start: task.startTime + task.duration,
        end: longTasks[index + 1].startTime
      })
    }
  })

  return quietPeriods
}

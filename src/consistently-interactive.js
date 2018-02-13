// naive implementation: find a last long task

export function getConsistentlyInteractive({ firstContentfulPaint: fmp, domContentLoaded: dcl, longTasks }) {
  const lastLongTask = longTasks[longTasks.length - 1]
  const lastTaskEnd = lastLongTask ? lastLongTask.startTime + lastLongTask.duration : 0
  return Math.max(lastTaskEnd, fmp, dcl)
}

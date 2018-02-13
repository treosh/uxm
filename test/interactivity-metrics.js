import test from 'ava'
import { values } from 'lodash'
import lighthouseResults from './fixtures/lighthouse-results.json'
import { getFirstInteractive, getConsistentlyInteractive } from '../src'

lighthouseResults.forEach(result => {
  const { index, firstContentfulPaint: fcp, domContentLoaded: dcl, longTasks } = result
  test(`${index}: fcp: ${fcp}ms, dcl: ${dcl}ms, longTasks: [${longTasks.map(t => values(t)).join(',')}]`, t => {
    const fi = getFirstInteractive(result)
    const ci = getConsistentlyInteractive(result)
    t.true(Math.abs(fi - result.firstInteractive) <= 2)
    t.true(Math.abs(ci - result.consistentlyInteractive) <= 2)
  })
})

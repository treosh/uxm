import test from 'ava'
import { values } from 'lodash'
import interactivity from './fixtures/interactivity.json'
import { getFirstInteractive } from '../src'

interactivity.forEach(result => {
  const { firstContentfulPaint: fcp, domContentLoaded: dcl, longTasks } = result
  test(`fcp: ${fcp}ms, dcl: ${dcl}ms, longTasks: [${longTasks.map(t => values(t)).join(',')}]`, t => {
    t.is(getFirstInteractive(result), result.firstInteractive)
    // t.is(getConsistentlyInteractive(result), result.consistentlyInteractive)
  })
})

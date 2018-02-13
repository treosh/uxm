import test from 'ava'
import { values } from 'lodash'
import interactivity from './fixtures/interactivity.json'
import { getFirstInteractive } from '../src'

interactivity.forEach(result => {
  const { firstContentfulPaint: fcp, domContentLoaded: dcl, firstMeaningfulPaint: fmp, longTasks } = result
  test(`fcp: ${fcp}ms, dcl: ${dcl}ms, fmp: ${fmp}ms, longTasks: [${longTasks.map(t => values(t)).join(',')}]`, t => {
    t.true(getFirstInteractive(result) - result.firstInteractive <= 2)
  })
})

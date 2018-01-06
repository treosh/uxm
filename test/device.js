import test from 'ava'
import userAgents from './fixtures/user-agents.json'
import { getDeviceType } from '../dist/uxm'

test('1000 most popular UA', t => {
  userAgents.forEach(({ ua, type }) => {
    t.is(getDeviceType(ua), type)
  })
})

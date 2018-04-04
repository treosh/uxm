import test from 'ava'
import puppeteer from 'puppeteer'
import devices from 'puppeteer/DeviceDescriptors'
import { readFileSync as readFile } from 'fs'
import { join } from 'path'

// read compiled src and wrap to browser compatible version

const src = readFile(join(__dirname, '../dist/uxm.js'), 'utf8')
const setupUxm = `
  window.uxm=(function(exports){
    ${src};
    return exports
  })({})
`

const url = 'https://booking.com'
const setupLongTasks = [
  "!function(){if('PerformanceLongTaskTiming' in window){var g=window.__lt={e:[]};",
  'g.o=new PerformanceObserver(function(l){g.e=g.e.concat(l.getEntries())});',
  "g.o.observe({entryTypes:['longtask']})}}();"
].join('')

test('booking.com', async t => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.evaluateOnNewDocument(setupLongTasks)
  await page.evaluateOnNewDocument(setupUxm)
  await page.emulate(devices['iPhone 6'])
  await page.goto(url)

  const result = await page.evaluate(() => window.uxm.uxm())
  await browser.close()
  console.log(JSON.stringify(result, null, '  '))

  t.deepEqual(Object.keys(result), [
    'deviceType',
    'deviceMemory',
    'effectiveConnectionType',
    'firstPaint',
    'firstContentfulPaint',
    'domContentLoaded',
    'onLoad',
    'userTiming'
  ])
  t.deepEqual(result.userTiming.map(u => u.name), ['b-stylesheets', 'b-fold', 'b-pre-scripts', 'b-post-scripts'])
})

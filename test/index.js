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

test.serial('booking.com - default settings', async t => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.evaluateOnNewDocument(setupUxm)
  await page.goto(url)

  const result = await page.evaluate(() => window.uxm.uxm())
  await browser.close()
  console.log(JSON.stringify(result, null, '  '))

  t.deepEqual(Object.keys(result), [
    'deviceType',
    'effectiveConnectionType',
    'timeToFirstByte',
    'firstPaint',
    'firstContentfulPaint',
    'domContentLoaded',
    'onLoad'
  ])
  t.is(result.deviceType, 'desktop')
  t.true(result.effectiveConnectionType === '4g' || result.effectiveConnectionType === '3g')
})

test.serial('booking.com - extra settings', async t => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.emulate(devices['iPhone 6'])
  await page.evaluateOnNewDocument(setupLongTasks)
  await page.evaluateOnNewDocument(setupUxm)
  await page.goto(url, { waitUntil: 'domcontentloaded' })

  const result = await page.evaluate(() =>
    window.uxm.uxm({ deviceMemory: true, userTiming: true, longTasks: true, resources: true })
  )
  const result2 = await page.evaluate(() => window.uxm.uxm({ all: true }))
  await browser.close()
  console.log(JSON.stringify(result2, null, '  '))

  t.is(result.deviceType, 'phone')
  t.deepEqual(
    result.userTiming.map(u => u.name),
    ['b-stylesheets', 'b-fold', 'b-pre-scripts', 'b-post-scripts']
  )

  t.deepEqual(Object.keys(result2), [
    'deviceType',
    'effectiveConnectionType',
    'timeToFirstByte',
    'firstPaint',
    'firstContentfulPaint',
    'domContentLoaded',
    'onLoad',
    'url',
    'userAgent',
    'deviceMemory',
    'userTiming',
    'longTasks',
    'resources'
  ])
})

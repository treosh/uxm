import test from 'ava'
import puppeteer from 'puppeteer'
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
  await page.goto(url)

  const result = await page.evaluate(() => window.uxm.uxm())
  t.deepEqual(Object.keys(result), ['deviceType', 'deviceMemory', 'connection', 'metrics', 'marks', 'measures'])
  t.deepEqual(Object.keys(result.metrics), ['firstPaint', 'firstContentfulPaint', 'onLoad', 'domContentLoaded'])
  t.deepEqual(result.marks, {})
  t.deepEqual(Object.keys(result.measures), ['b-stylesheets', 'b-pre-scripts', 'b-post-scripts'])

  // experimental

  const longTasks = await page.evaluate(() => window.uxm.getLongTasks())
  const fi = await page.evaluate(() => window.uxm.getFirstInteractive())

  t.true(longTasks.length > 0)
  t.true(fi > 0)

  console.log(JSON.stringify(result, null, '  '))
  console.log(JSON.stringify({ fi, longTasks }, null, '  '))

  await browser.close()
})

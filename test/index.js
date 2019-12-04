import test from 'ava'
import puppeteer from 'puppeteer'
import { readFileSync as readFile } from 'fs'
import { join } from 'path'

// read compiled src and wrap to browser compatible version
const uxmBundle = readFile(join(__dirname, '../dist/uxm.bundle.js'), 'utf8')

test.serial('basic test', async t => {
  const url = 'https://treo.sh/'
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  // page.on('console', msg => console.log(msg.text()))
  await page.evaluateOnNewDocument(uxmBundle)
  await page.goto(url)
  await page.evaluate(() => {
    window.deviceInfo = window.uxm.getDeviceInfo()
    window.metrics = {}
    window.uxm.debug.enable = true
    window.uxm.collectMetrics(
      ['fcp', 'fid', { type: 'lcp', maxTimeout: 1000 }, { type: 'cls', maxTimeout: 1000 }, 'ttfb', 'load', 'dcl'],
      metric => (window.metrics[metric.type] = metric)
    )
  })
  await page.click('a[href="/signup"]')
  await new Promise(resolve => setTimeout(resolve, 2000))
  const [metrics, deviceInfo] = await page.evaluate(() => [window.metrics, window.deviceInfo])
  console.log({ metrics, deviceInfo })
  await browser.close()

  t.deepEqual(Object.keys(metrics), ['ttfb', 'load', 'dcl', 'fcp', 'fid', 'cls', 'lcp'])
  t.true(metrics.fcp.value > 100 && typeof metrics.fcp.value === 'number')
  t.true(metrics.lcp.value > 100 && typeof metrics.lcp.value === 'number')
  t.true(metrics.fid.value >= 1 && typeof metrics.fid.value === 'number')

  t.deepEqual(Object.keys(deviceInfo), ['url', 'userAgent', 'memory', 'connectionType', 'cpus'])
  t.is(deviceInfo.url, url)
  t.true(deviceInfo.memory >= 1 && typeof deviceInfo.memory === 'number')
  t.true(deviceInfo.connectionType === '4g' || deviceInfo.connectionType === '3g')
  t.true(deviceInfo.cpus >= 1 && typeof deviceInfo.cpus === 'number')
  t.true(typeof deviceInfo.userAgent === 'string')
})

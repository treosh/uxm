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
  await page.evaluateOnNewDocument(uxmBundle)
  await page.goto(url)

  const device = await page.evaluate(() => uxm.getDeviceInfo())
  await page.evaluate(() => {
    uxm.onNavigation(navTiming => (window.navTiming = navTiming))
  })
  await page.evaluate(() => {
    window.uxMetrics = {}
    uxm.observeMetric('fcp', fcp => (uxMetrics.fcp = fcp))
    uxm.observeMetric('lcp', lcp => (uxMetrics.lcp = lcp))
    uxm.observeMetric('fid', fid => (uxMetrics.fid = fid))
    // it's not possible to get CLS in headless mode
    // https://github.com/GoogleChrome/puppeteer/issues/1462#issuecomment-356623793
    uxm.observeMetric('cls', cls => (uxMetrics.cls = cls))
  })

  await page.click('a[href="/signup"]')
  await new Promise(resolve => setTimeout(resolve, 1000))
  const [uxMetrics, navTiming] = await page.evaluate(() => [window.uxMetrics, window.navTiming])
  await browser.close()

  console.log({ uxMetrics, navTiming, device })

  t.true(uxMetrics.fcp > 100 && typeof uxMetrics.fcp === 'number')
  // t.true(uxMetrics.lcp > 300 && uxMetrics.lcp > uxMetrics.fcp && typeof uxMetrics.lcp === 'number')
  t.true(uxMetrics.fid >= 1 && typeof uxMetrics.fid === 'number')

  t.true(navTiming.timeToFirstByte > 300 && typeof navTiming.timeToFirstByte === 'number')
  t.true(navTiming.domContentLoaded > 500 && typeof navTiming.domContentLoaded === 'number')
  t.true(navTiming.load > 500 && typeof navTiming.load === 'number')
  t.true(navTiming.serverTiming.length === 0)

  t.true(device.url === url)
  t.true(device.deviceType === 'desktop')
  t.true(device.deviceMemory >= 1 && typeof device.deviceMemory === 'number')
  t.true(device.effectiveConnectionType === '4g' || device.effectiveConnectionType === '3g')
  t.true(device.hardwareConcurrency >= 1 && typeof device.hardwareConcurrency === 'number')
})

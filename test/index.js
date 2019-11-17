import test from 'ava'
import puppeteer from 'puppeteer'
import { readFileSync as readFile } from 'fs'
import { join } from 'path'

// read compiled src and wrap to browser compatible version
const uxmBundle = readFile(join(__dirname, '../dist/uxm.bundle.js'), 'utf8')

test.serial('booking.com - loading metrics', async t => {
  const url = 'https://treo.sh/'
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.evaluateOnNewDocument(uxmBundle)
  await page.goto(url)

  const navigationMetrics = await page.evaluate(async () => ({
    ttfb: await uxm.getTimeToFirstByte(),
    dcl: await uxm.getDomContentLoaded(),
    ol: await uxm.getOnLoad()
  }))
  const dimensions = await page.evaluate(() => ({
    url: uxm.getUrl(),
    effectiveConnectionType: uxm.getEffectiveConnectionType(),
    deviceMemory: uxm.getDeviceMemory(),
    hardwareConcurrency: uxm.getHardwareConcurrency()
  }))
  await page.evaluate(() => {
    window.uxMetrics = {}
    uxm.metrics
      .on('fcp', fcp => (uxMetrics.fcp = fcp))
      .on('lcp', lcp => (uxMetrics.lcp = lcp))
      .on('fid', fid => (uxMetrics.fid = fid))
      // it's not possible to get CLS in headless mode
      // https://github.com/GoogleChrome/puppeteer/issues/1462#issuecomment-356623793
      .on('cls', cls => (uxMetrics.cls = cls))
  })

  await page.click('a[href="/signup"]')
  const uxMetrics = await page.evaluate(() => window.uxMetrics)
  await browser.close()

  console.log({ uxMetrics, navigationMetrics, dimensions })

  t.true(uxMetrics.fcp > 300 && typeof uxMetrics.fcp === 'number')
  t.true(uxMetrics.lcp > 500 && uxMetrics.lcp > uxMetrics.fcp && typeof uxMetrics.lcp === 'number')
  t.true(uxMetrics.fid >= 1 && typeof uxMetrics.fid === 'number')

  t.true(navigationMetrics.ttfb > 300 && typeof navigationMetrics.ttfb === 'number')
  t.true(navigationMetrics.dcl > 800 && typeof navigationMetrics.dcl === 'number')
  t.true(navigationMetrics.ol > 1000 && typeof navigationMetrics.ol === 'number')

  t.true(dimensions.url === url)
  t.true(dimensions.effectiveConnectionType === '4g' || dimensions.effectiveConnectionType === '3g')
  t.true(dimensions.deviceMemory >= 1 && typeof dimensions.deviceMemory === 'number')
  t.true(dimensions.hardwareConcurrency >= 1 && typeof dimensions.hardwareConcurrency === 'number')
})

import test from 'ava'
import puppeteer from 'puppeteer'
import fs from 'fs'
import { join } from 'path'

const url = 'https://treo.sh/'
const uxmSrc = fs.readFileSync(join(__dirname, '../dist/uxm.js'), 'utf8')
const setupUxm = `
  window.uxm=(function(exports){
    ${uxmSrc};
    return exports
  })({})
`

test.serial('booking.com - default settings', async (t) => {
  // launch a url

  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.evaluateOnNewDocument(setupUxm)
  await page.goto(url)

  // collect metrics

  const result = await page.evaluate(() => {
    // @ts-ignore
    const { getDeviceInfo, collectMetrics, collectLoad } = window.uxm
    const metrics = {}
    let load = null
    collectMetrics(
      ['fcp', 'fid', { type: 'cls', maxTimeout: 1000 }, { type: 'lcp', maxTimeout: 1000 }],
      (metric) => (metrics[metric.metricType] = metric)
    )
    collectLoad((l) => (load = l))
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          deviceInfo: getDeviceInfo(),
          metrics,
          load,
        })
      }, 2000)
    })
  })

  await browser.close()
  console.log(JSON.stringify(result, null, '  '))
  const { deviceInfo, metrics, load } = result

  // test device info

  t.deepEqual(Object.keys(deviceInfo).sort(), ['connection', 'cpus', 'memory', 'referrer', 'url', 'userAgent'])
  t.deepEqual(Object.keys(deviceInfo.connection).sort(), ['downlink', 'effectiveType', 'rtt'])
  t.is(typeof deviceInfo.cpus, 'number')
  t.is(typeof deviceInfo.memory, 'number')
  t.is(typeof deviceInfo.userAgent, 'string')
  t.is(deviceInfo.referrer, '')
  t.is(deviceInfo.url, url)

  // assert metrics

  t.deepEqual(Object.keys(metrics.fcp).sort(), ['metricType', 'value'])
  t.is(metrics.fcp.metricType, 'fcp')
  t.is(typeof metrics.fcp.value, 'number')

  t.deepEqual(Object.keys(metrics.lcp).sort(), ['detail', 'metricType', 'value'])
  t.deepEqual(Object.keys(metrics.lcp.detail).sort(), ['elementSelector', 'size'])
  t.is(metrics.lcp.metricType, 'lcp')
  t.is(typeof metrics.lcp.value, 'number')
  t.is(typeof metrics.lcp.detail.size, 'number')
  t.is(typeof metrics.lcp.detail.elementSelector, 'string')

  t.deepEqual(Object.keys(metrics.cls).sort(), ['detail', 'metricType', 'value'])
  t.is(metrics.cls.metricType, 'cls')
  t.true(metrics.cls.value < 1)

  // assert load

  t.deepEqual(Object.keys(load).sort(), ['detail', 'metricType', 'value'])
  t.deepEqual(Object.keys(load.detail).sort(), ['domContentLoaded', 'timeToFirstByte'])
  t.is(load.metricType, 'load')
  t.is(typeof load.value, 'number')
  t.is(typeof load.detail.timeToFirstByte, 'number')
  t.is(typeof load.detail.domContentLoaded, 'number')
})

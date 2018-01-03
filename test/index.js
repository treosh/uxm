import test from 'ava'
import puppeteer from 'puppeteer'
import { readFileSync as readFile } from 'fs'
import { join } from 'path'

// read compiled src and wrap to browser compatible version

const src = readFile(join(__dirname, '../dist/index.js'), 'utf8')
const browserSrc = `
  window.runMetrics=function(exports){
    ${src};
    return metrics()
  }
`

test('treo.sh', async t => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('https://booking.com')
  await page.addScriptTag({ content: browserSrc })

  const result = await page.evaluate(() => window.runMetrics({}))
  console.log(JSON.stringify(result, null, '  '))

  t.deepEqual(Object.keys(result), ['effectiveConnectionType', 'metrics', 'now', 'marks', 'measures'])
  t.is(result.effectiveConnectionType, '4g')
  t.deepEqual(Object.keys(result.metrics), ['firstPaint', 'firstContentfulPaint', 'onLoad', 'domContentLoaded'])
  t.deepEqual(result.marks, {})
  t.deepEqual(Object.keys(result.measures), ['b-stylesheets', 'b-pre-scripts', 'b-post-scripts'])

  await browser.close()
})

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
  await page.goto('https://treo.sh')
  await page.addScriptTag({ content: browserSrc })

  const result = await page.evaluate(() => window.runMetrics({}))
  console.log(result)
  t.deepEqual(Object.keys(result), ['effectiveConnectionType', 'metrics', 'customMetrics'])
  t.is(result.effectiveConnectionType, '4g')
  t.deepEqual(Object.keys(result.customMetrics), ['ready:home'])

  await browser.close()
})

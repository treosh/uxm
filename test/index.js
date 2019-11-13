import test from 'ava'
import puppeteer from 'puppeteer'
import { readFileSync as readFile } from 'fs'
import { join } from 'path'

// read compiled src and wrap to browser compatible version

const uxmBundle = readFile(join(__dirname, '../dist/uxm.bundle.js'), 'utf8')
const url = 'https://booking.com'

test.serial('booking.com - default settings', async t => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.evaluateOnNewDocument(uxmBundle)
  await page.goto(url)

  const fcp = await page.evaluate(() => uxm.getFirstContentfulPaint())
  await browser.close()
  t.true(fcp > 300 && typeof fcp === 'number')
})

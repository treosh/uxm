// usage: node -r babel-register ./test/fixtures/parse-user-agents.js
//
// scan most popular UAs by 3 types (phone, tablet, computer):
// https://developers.whatismybrowser.com/useragents/explore/hardware_type_specific/

import puppeteer from 'puppeteer'
import { writeFileSync as writeFile } from 'fs'
import { join } from 'path'
const url = 'https://developers.whatismybrowser.com/useragents/explore/hardware_type_specific/'

const PAGES_TO_PARSE = 5

const range = length => [...Array(length).keys()].slice(1)

async function main() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  const userAgents = {}

  // each page contains 50 values
  for (const type of ['phone', 'tablet', 'computer']) {
    userAgents[type] = []
    for (const pageNumber of range(PAGES_TO_PARSE)) {
      await page.goto(`${url}/${type}/${pageNumber}`)
      const data = await page.$$eval('.table-useragents tbody > tr', trs => {
        return [].map.call(trs, tr => {
          const td = tr.querySelectorAll('td')
          return {
            ua: td[0].textContent,
            software: td[1].textContent,
            os: td[2].textContent,
            engine: td[3].textContent
          }
        })
      })
      userAgents[type].push(...data)
    }
  }

  writeFile(join(__dirname, 'user-agents.json'), JSON.stringify(userAgents, null, '  '))
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

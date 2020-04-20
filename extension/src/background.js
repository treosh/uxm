import { calcSpeedScore } from '../../src/experimental'

/** @typedef {{ score: number, values: { fcp?: number, lcp?: number, fid?: number, cls?: number }, error?: string }} UxmResult */
/** @type {Map<number,UxmResult | null>} */
const store = new Map()

// colors (https://coolors.co/ef6853-ffc15e-42b29a-4357ad-171219)

const greenColor = '#42B29A'
const yellowColor = '#FFC15E'
const redColor = '$EF6853'

// Receive message from `content.js` with newValues.

chrome.runtime.onMessage.addListener((newValues, sender) => {
  const tabId = sender.tab ? sender.tab.id : null
  if (!tabId) return
  const result = /** @type {UxmResult} */ (store.get(tabId) || { score: 1, values: {} })
  const values = { ...result.values, ...newValues }
  const newResult = /** @type {UxmResult} */ ({ score: calcSpeedScore(values), values })
  store.set(tabId, newResult)
  setIconResult(tabId, newResult)
})

// helpers

/** @param {number} tabId @param {UxmResult} result */
function setIconResult(tabId, result) {
  if (!result.values.lcp) return
  const color = result.score >= 0.9 ? greenColor : result.score >= 0.5 ? yellowColor : redColor
  chrome.browserAction.setTitle({ title: JSON.stringify(result), tabId })
  chrome.browserAction.setBadgeText({ text: Math.round(100 * result.score).toString(), tabId })
  chrome.browserAction.setBadgeBackgroundColor({ color, tabId })
}

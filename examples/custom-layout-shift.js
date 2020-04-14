import { observeEntries } from '..'
import { observeHistory } from '../src/experimental'

/** @type {{ url: string, cls: number }[]} */
let views = []
let cls = 0

// cummulate `layout-shift` values, with an input

observeEntries('layout-shift', (layoutShiftEntries) => {
  layoutShiftEntries.forEach((e) => {
    if (!e.hadRecentInput) cls += e.value
  })
})

// observe `history` changes
// and reset `cls` when it changes

observeHistory((e) => {
  views.push({ url: e.prevUrl, cls })
  cls = 0
})

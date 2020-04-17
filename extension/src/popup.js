let history = document.getElementById('history')
let clear = document.getElementById('clear')

let getColor = chrome.extension.getBackgroundPage().getColor
let badgeTextFromScore = chrome.extension.getBackgroundPage().badgeTextFromScore

chrome.storage.local.get(null, function (items) {
  let scores = ''

  let itemsArray = []

  for (const result in items) {
    // ignore the "-1" error runs
    if (items[result].score >= 0) itemsArray.push(items[result])
  }

  let sortedByScore = itemsArray.sort((a, b) => (a.score > b.score ? 1 : -1))

  for (item of sortedByScore) {
    let score = badgeTextFromScore(item.score)
    if (score != 'BAD') {
      score += 's'
    }

    scores += `<div class="item">
    <div class="score ${getColor(item.score)}">${score}</div>
    <div class="title"><a href="${item.url}" title="${item.url}">${item.title}</a></div>
    <div class="domain">${extractDomain(item.url)}</div>
  </div>
`
  }

  history.innerHTML = scores
})

// Clear local storage... FOREVER!
clear.addEventListener('click', () => {
  chrome.storage.local.clear()
})

// A simple (read: won't work for everything) function to get a domain from a URL
function extractDomain(url) {
  let domain
  //find & remove protocol (http, ftp, etc.) and get domain
  if (url.indexOf('://') > -1) {
    domain = url.split('/')[2]
  } else {
    domain = url.split('/')[0]
  }

  //find & remove www
  if (domain.indexOf('www.') > -1) {
    domain = domain.split('www.')[1]
  }

  domain = domain.split(':')[0] //find & remove port number
  domain = domain.split('?')[0] //find & remove url params

  return domain
}

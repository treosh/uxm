import { render } from 'preact'
import { html } from 'htm/preact'
import { css } from 'linaria'

// init `App`

function App() {
  return html`<div className=${style.root}>Živjo!</div>`
}

const style = {
  root: css`
    background: red;
    height: 100px;
    width: 200px;
  `,
}

// render

const $root = document.getElementById('root')
if ($root) {
  render(html`<${App} />`, $root)
}

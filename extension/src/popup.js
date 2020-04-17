import { h, render } from 'preact'
import { css } from 'linaria'

// init `App`

function App() {
  return <div className={style.root}>Živjo!</div>
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
  render(<App />, $root)
}

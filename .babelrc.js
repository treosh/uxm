module.exports = {
  presets: [['@babel/preset-env', { bugfixes: true, targets: { esmodules: true } }], 'linaria/babel'],
  plugins: [
    ['@babel/plugin-transform-runtime', { helpers: true, regenerator: false, useESModules: true }],
    ['@babel/plugin-transform-react-jsx', { pragma: 'h', pragmaFrag: 'preact.Fragment' }]
  ]
}

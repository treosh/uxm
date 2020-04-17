const { compact } = require('lodash')
const { resolve } = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')

// bundle for the web

const isProd = process.env.NODE_ENV === 'production'
module.exports = {
  mode: isProd ? 'production' : 'development',
  target: 'web',
  devtool: process.env.SOURCE_MAPS ? 'source-map' : false,
  context: resolve('extension'),
  entry: {
    background: './src/background.js',
    content: './src/content.js',
    popup: './src/popup.js',
  },
  output: {
    path: resolve('extension/dist'),
    filename: `[name].js`,
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [['@babel/preset-env', { bugfixes: true, targets: { esmodules: true } }], 'linaria/babel'],
              plugins: [
                ['@babel/plugin-transform-runtime', { helpers: true, regenerator: false, useESModules: true }],
                ['@babel/plugin-transform-react-jsx', { pragma: 'h', pragmaFrag: 'preact.Fragment' }],
              ],
            },
          },
          { loader: 'linaria/loader' },
        ],
      },
      {
        test: /\.(jpeg|png)$/,
        loader: 'file-loader',
        options: { name: `files/[name].[ext]` },
      },
      {
        test: /\.css$/,
        use: compact([MiniCssExtractPlugin.loader, 'css-loader']),
      },
    ],
  },
  plugins: compact([
    new MiniCssExtractPlugin({ filename: `website/css/[name].css` }),
    new HtmlWebpackPlugin({
      filename: 'popup.html',
      minify: isProd,
      chunks: ['popup'],
      inlineSource: isProd ? '.(js|css)$' : '',
    }),
    new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin),
    isProd ? new OptimizeCssAssetsPlugin() : null,
  ]),
}

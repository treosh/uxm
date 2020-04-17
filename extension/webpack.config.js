const { compact } = require('lodash')
const { resolve } = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

// bundle for the web

const isProd = process.env.NODE_ENV === 'production'
module.exports = {
  mode: isProd ? 'production' : 'development',
  target: 'web',
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
        use: [{ loader: 'linaria/loader' }],
      },
      {
        test: /\.(jpeg|png)$/,
        loader: 'file-loader',
        options: { name: `files/[name].[ext]` },
      },
      {
        test: /\.css$/,
        use: [{ loader: MiniCssExtractPlugin.loader }, { loader: 'css-loader' }],
      },
    ],
  },
  plugins: compact([
    new MiniCssExtractPlugin({ filename: `[name].css` }),
    new HtmlWebpackPlugin({
      filename: 'popup.html',
      minify: isProd,
      template: './src/popup.html',
      chunks: ['popup'],
    }),
    isProd ? new OptimizeCssAssetsPlugin() : null,
    new CopyPlugin([{ from: './manifest.json', to: '.' }]),
  ]),
}

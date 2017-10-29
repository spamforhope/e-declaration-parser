const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const autoprefixer = require('autoprefixer');
const path = require('path');

module.exports = {
  entry: [
    path.resolve(__dirname, 'app/main')
  ],
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: '/',
    filename: '[name].bundle.js'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico)$/i,
        use: 'file-loader?name=images/[name].[ext]'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader?sourceMap', 'postcss-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index-template.html',
      inject: 'body'
    })
  ],
  devtool: 'source-map',
  devServer: {
    port: 9000,
    contentBase: path.join(__dirname, 'build'),
    historyApiFallback: true,
    compress: true,
    overlay: true
  }
}
const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: ["babel-polyfill", "./src/index.js"],
  devServer: {
    port: 8091,
    contentBase: "./dist",
    disableHostCheck: true,
  },
  module: {
    rules: [
      {
        test: /.js$/,
        exclude: /node_modules/,
        use: "babel-loader"
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html",
      filename: "index.html"
    })
  ],
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    filename: "bundle.[hash].js"
  }
}

/* global require, module, __dirname */

const path = require("path");

module.exports = {
  entry: {
    feature: "./ts/feature.js/index.ts",
    content: "./ts/content.js/index.ts",
    report: "./ts/report.js/index.tsx",
  },
  output: {
    path: path.resolve(__dirname, "src"),
    filename: "[name].js",
    sourceMapFilename: "[name].js.map",
    pathinfo: true,
  },
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  mode: "development",
  devtool: "inline-source-map",
};

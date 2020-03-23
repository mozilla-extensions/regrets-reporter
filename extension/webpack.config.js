/* global require, module, __dirname */

const path = require("path");

module.exports = {
  entry: {
    feature: "./ts/feature.js/index.ts",
    content: "./ts/content.js/index.ts",
    report: "./ts/report.js/index.ts",
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
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  mode: "development",
  devtool: "inline-source-map",
};

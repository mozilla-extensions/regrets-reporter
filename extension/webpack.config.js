/* global require, module, __dirname */

const path = require("path");

module.exports = {
  entry: {
    "user-interaction-instrument-content-script":
      "./ts/user-interaction-instrument-content-script.js/index.ts",
    background: "./ts/background.js/index.ts",
    "get-started": "./ts/get-started.js/index.tsx",
    "report-regret-form": "./ts/report-regret-form.js/index.tsx",
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
      {
        test: /\.css$/i,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
            },
          },
          "postcss-loader",
        ],
      },
      {
        test: /\.svg/,
        use: {
          loader: "svg-url-loader",
          options: {},
        },
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

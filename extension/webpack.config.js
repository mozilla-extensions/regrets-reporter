/* global process, require, module, __dirname */

const path = require("path");

const Dotenv = require("dotenv-webpack");
const CopyPlugin = require("copy-webpack-plugin");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");

const targetBrowser = process.env.TARGET_BROWSER || "firefox";
const destPath = path.join(__dirname, "build", targetBrowser);

const dotEnvPath =
  process.env.NODE_ENV === "production"
    ? "./.env.production"
    : "./.env.development";

// Workaround for https://github.com/getsentry/sentry-cli/issues/302
const fs = require("fs");
fs.createReadStream(dotEnvPath).pipe(fs.createWriteStream("./.env"));

const plugins = [
  new Dotenv({
    path: dotEnvPath,
  }),
  new CopyPlugin({
    patterns: [{ from: "src", to: destPath }],
  }),
];

// Don't upload sources to Sentry when running unit tests or offline development is specified
if (process.env.NODE_ENV !== "test" && process.env.OFFLINE !== "1") {
  plugins.push(
    new SentryWebpackPlugin({
      include: destPath,
    }),
  );
}

module.exports = {
  entry: {
    "ui-instrument-content-script":
      "./ts/ui-instrument-content-script.js/index.ts",
    "response-body-listener-content-script":
      "./ts/response-body-listener-content-script.js/index.ts",
    background: "./ts/background.js/index.ts",
    "get-started": "./ts/get-started.js/index.tsx",
    "report-regret-form": "./ts/report-regret-form.js/index.tsx",
    "options-ui": "./ts/options-ui.js/index.tsx",
  },
  output: {
    path: destPath,
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
  plugins,
  mode: "development",
  devtool: "source-map",
};

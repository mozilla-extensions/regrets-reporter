/* eslint-env node */

const reporters = ["mocha", "istanbul"];
if (process.env.COVERALLS_REPO_TOKEN) {
  reporters.push("coveralls");
}

const webpackConfig = require("./webpack.config.js");

// https://github.com/webpack-contrib/karma-webpack/issues/231
webpackConfig.entry = null;

module.exports = function(config) {
  config.set({
    singleRun: true,
    browsers: [
      // "Firefox",
      // "FirefoxAurora", // Firefox Beta
      "FirefoxDeveloper",
      // "FirefoxNightly",
    ],
    frameworks: ["mocha", "chai"],
    reporters,
    istanbulReporter: {
      dir: "test/results/coverage",
      reporters: [
        {
          type: "lcov",
          subdir: "lcov",
        },
        {
          type: "html",
        },
        {
          type: "text-summary",
        },
      ],
    },
    files: [
      "node_modules/sinon/pkg/sinon.js",
      "node_modules/sinon-chrome/bundle/sinon-chrome.min.js",
      "ts/**/*.spec.ts",
      // "ts/**/index.ts",
      // "test/unit/*.spec.js",
    ],
    webpack: webpackConfig,
    preprocessors: {
      "ts/**/*.ts": ["webpack"],
      "src/**/*.js": ["babel"],
    },
    plugins: [
      "karma-babel-preprocessor",
      "karma-chai",
      "karma-coveralls",
      "karma-istanbuljs-reporter",
      "karma-firefox-launcher",
      "karma-mocha",
      "karma-mocha-reporter",
      "karma-webpack",
    ],
  });
};

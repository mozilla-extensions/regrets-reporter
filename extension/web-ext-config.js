/* eslint-env node */

const defaultConfig = {
  // Global options:
  sourceDir: "./src/",
  artifactsDir: "./dist/",
  ignoreFiles: [".DS_Store"],
  // Command options:
  build: {
    overwriteDest: true,
  },
  run: {
    firefox: process.env.FIREFOX_BINARY || "firefoxdeveloperedition",
    browserConsole: true,
    startUrl: [
      "about:debugging#/runtime/this-firefox",
      "https://www.youtube.com/watch?v=g4mHPeMGTJM",
    ],
    pref: ["browser.ctrlTab.recentlyUsedOrder=false"],
  },
};

module.exports = defaultConfig;

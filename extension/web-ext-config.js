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
    browserConsole: false,
    startUrl: [
      "about:devtools-toolbox?type=extension&id=regrets-reporter%40mozillafoundation.org",
      "https://www.youtube.com/watch?v=g4mHPeMGTJM",
      "about:debugging#/runtime/this-firefox",
    ],
    pref: ["browser.ctrlTab.recentlyUsedOrder=false"],
  },
};

module.exports = defaultConfig;

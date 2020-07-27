/* eslint-env node */
const path = require("path");

const targetBrowser = process.env.TARGET_BROWSER || "firefox";

const exampleYoutubeWatchpage = "https://www.youtube.com/watch?v=g4mHPeMGTJM";

const sourceDir = path.join(".", "build", targetBrowser);
const artifactsDir = path.join(".", "dist", targetBrowser);

const defaultConfig = {
  // Global options:
  sourceDir,
  artifactsDir,
  ignoreFiles: [".DS_Store"],
  // Command options:
  build: {
    overwriteDest: true,
  },
  run: {
    browserConsole: false,
    startUrl: [
      "about:devtools-toolbox?type=extension&id=regrets-reporter%40mozillafoundation.org",
      exampleYoutubeWatchpage,
      "about:debugging#/runtime/this-firefox",
    ],
    pref: ["browser.ctrlTab.recentlyUsedOrder=false"],
  },
  filename: `{name}-{version}-${targetBrowser}.xpi`
};

if (targetBrowser === "firefox") {
  defaultConfig.run.firefox =
    process.env.FIREFOX_BINARY || "firefoxdeveloperedition";
  defaultConfig.run.target = ["firefox-desktop"];
}

if (targetBrowser === "chrome") {
  defaultConfig.run.target = ["chromium"];
  defaultConfig.run.startUrl = [exampleYoutubeWatchpage, "chrome://extensions"];
}

module.exports = defaultConfig;

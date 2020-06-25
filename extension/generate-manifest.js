/* eslint-env node */

const fs = require("fs");
const path = require("path");
const packageJson = require("./package.json");
const targetBrowser = process.env.TARGET_BROWSER || "firefox";
const destPath = path.join(__dirname, "build", targetBrowser);

async function generateManifest({ dotEnvPath }) {
  require("dotenv").config({ path: dotEnvPath });
  const manifest = {
    manifest_version: 2,
    name: `RegretsReporter${
      process.env.NODE_ENV !== "production" ? " (DEV)" : ""
    }`,
    description: "__MSG_extensionDescription__",
    version: `${packageJson.version}`,
    hidden: false,
    incognito: "not_allowed",
    applications: {
      gecko: {
        id: "regrets-reporter@mozillafoundation.org",
        strict_min_version: "76.0a1",
      },
    },
    default_locale: "en_US",
    background: {
      scripts: ["background.js"],
    },
    content_scripts: [],
    permissions: [
      "*://*.youtube.com/*",
      // "*://*.youtu.be/*",
      `${process.env.TELEMETRY_SERVER}/*`,
      "webRequest",
      "webRequestBlocking",
      "webNavigation",
      "storage",
      "alarms",
    ],
    icons: {},
    page_action: {
      default_title: "__MSG_pageActionButtonTitle__",
      default_popup: "report-regret-form/report-regret-form.html",
    },
    browser_action: {
      default_title: "__MSG_pageActionButtonTitle__",
      default_popup: "report-regret-form/report-regret-form.html",
    },
    options_ui: {
      page: "options-ui/options-ui.html",
    },
  };
  if (targetBrowser === "firefox") {
    manifest.page_action.browser_style = true;
    manifest.browser_action.browser_style = true;
    manifest.options_ui.browser_style = true;
  }
  if (targetBrowser === "chrome") {
    manifest.page_action.chrome_style = true;
    manifest.browser_action.chrome_style = true;
    manifest.options_ui.chrome_style = true;
  }
  const targetPath = path.join(destPath, "manifest.json");
  await fs.promises.mkdir(destPath, { recursive: true });
  await fs.promises.writeFile(targetPath, JSON.stringify(manifest, null, 2));
}

module.exports = { generateManifest };

if (require.main === module) {
  const dotEnvPath =
    process.env.NODE_ENV === "production"
      ? "./.env.production"
      : "./.env.development";
  generateManifest({ dotEnvPath });
}

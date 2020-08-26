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
    incognito: "not_allowed",
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
    icons: {
      48: "icons/extension-icon.svg.48x48.png",
      96: "icons/extension-icon.svg.96x96.png",
    },
    browser_action: {
      default_icon: "icons/icon-toolbar-inactive.svg",
      default_title: "__MSG_pageActionButtonTitle__",
      default_popup: "not-available/not-available.html",
    },
    options_ui: {
      page: "options-ui/options-ui.html",
    },
  };
  if (targetBrowser === "firefox") {
    manifest.applications = {
      gecko: {
        id: "regrets-reporter@mozillafoundation.org",
        strict_min_version: "80.0a1",
      },
    };
    manifest.browser_action.browser_style = false;
    manifest.options_ui.browser_style = false;
  }
  if (targetBrowser === "chrome") {
    manifest.browser_action.chrome_style = false;
    manifest.options_ui.chrome_style = false;
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

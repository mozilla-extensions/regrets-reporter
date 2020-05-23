/* eslint-env node */

const fs = require("fs");
const { template } = require("safe-es6-template");
const packageJson = require("./package.json");

async function buildManifest({ dotEnvPath }) {
  require("dotenv").config({ path: dotEnvPath });
  const templateData = {
    package: packageJson,
    env: process.env,
  };
  const sourcePath = "./manifest.template.json";
  const targetPath = "./src/manifest.json";
  const content = await fs.promises.readFile(sourcePath, { encoding: "utf8" });
  const rendered = template(content, templateData);
  await fs.promises.writeFile(targetPath, rendered);
}

module.exports = { buildManifest };

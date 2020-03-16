/* eslint-env node */

const semver = require("semver");
const requiredNodeEngineVersion = require("../package.json").engines.node;
const currentNodeEngineVersion = process.versions.node;
if (!semver.satisfies(currentNodeEngineVersion, requiredNodeEngineVersion)) {
  console.error(
    `Node version needs to be ${requiredNodeEngineVersion} for tests to run. Currently ${currentNodeEngineVersion}. Exiting...`,
  );
  process.exit(1);
}

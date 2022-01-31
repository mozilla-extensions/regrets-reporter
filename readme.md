# RegretsReporter

## What the add-on does

The RegretsReporter browser extension, built by the nonprofit Mozilla, lets you report regrettable recommendations on YouTube.

## Building the extension

1. Make sure you have `node.js>=16` and [`corepack`](https://nodejs.org/dist/latest-v17.x/docs/api/corepack.html) installed.
2. Run `corepack enable` to install automatically the correct version of yarn.
3. Run `yarn --immutable` to install package dependencies.
4. Run `yarn build` to build the extension from source.
5. Bundled & minified source code can now be found `distribution` directory.

## Releases

This extension is being automatically built and bundled into an unsigned XPI using the [Github CI](https://github.com/mozilla-extensions/regrets-reporter/blob/master/.github/workflows/release.yml).  
You can download such builds in the [releases](https://github.com/mozilla-extensions/regrets-reporter/releases) section.

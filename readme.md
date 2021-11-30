# RegretsReporter

## What the add-on does

The RegretsReporter browser extension, built by the nonprofit Mozilla, lets you report regrettable recommendations on YouTube.

## Building the extension

1. Make sure you have `yarn^1.22` and `node.js^16` installed.
1. Run `yarn --frozen-lockfile` to install package dependencies.
2. Run `yarn build` to build the extension from source.
3. Bundled & minified source code can now be found `dist` directory.

## Releases

This extension is being automatically built and bundled into an unsigned XPI using the [Github CI](https://github.com/adelsz/regrets-reporter/blob/master/.github/workflows/release.yml).  
You can download such builds in the [releases](https://github.com/adelsz/regrets-reporter/releases) section.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Developing this add-on](#developing-this-add-on)
  - [Get started](#get-started)
  - [Creating build artifacts](#creating-build-artifacts)
  - [Development mode](#development-mode)
  - [Opening up specific add-on pages](#opening-up-specific-add-on-pages)
  - [Checking current report data](#checking-current-report-data)
  - [Checking current YouTube usage statistics](#checking-current-youtube-usage-statistics)
  - [Export shared data](#export-shared-data)
  - [Collecting traffic data for test fixtures](#collecting-traffic-data-for-test-fixtures)
    - [NavigationBatchPreprocessor](#navigationbatchpreprocessor)
    - [ReportSummarizer](#reportsummarizer)
  - [Creating a signed build of the add-on for self-distribution](#creating-a-signed-build-of-the-add-on-for-self-distribution)
  - [Generating JSON schema for telemetry ingestion based on typings](#generating-json-schema-for-telemetry-ingestion-based-on-typings)
  - [Validating the generated JSON schema](#validating-the-generated-json-schema)
  - [Troubleshooting](#troubleshooting)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Developing this add-on

## Get started

```
yarn install
cp .env.example .env.development
cp .env.example .env.production
```

Configure `.env.development` and `.env.production` with values as per https://docs.sentry.io/cli/configuration/.

Hint: You can verify that the Sentry configuration is working using:

```
cp .env.development .env
npx sentry-cli info
cp .env.production .env
npx sentry-cli info
```

## Creating build artifacts

To build for Firefox:

```
yarn build:production
```

The build artifact will be created under `dist/firefox/`.

For Chrome:

```
TARGET_BROWSER=chrome yarn build:production
```

The build artifact will be created under `dist/chrome/`.

## Development mode

To build for and launch Firefox, install the extension and start Webpack in watch mode:

```
yarn watch
```

For Chrome:

```
yarn watch:chrome
```

## Opening up specific add-on pages

From the background context:

```javascript
(typeof browser !== "undefined" ? browser : chrome).runtime.getURL(
  `report-regret-form/report-regret-form.html?skipWindowAndTabIdFilter=1`,
);
```

```javascript
(typeof browser !== "undefined" ? browser : chrome).runtime.getURL(
  `get-started/get-started.html`,
);
```

```javascript
(typeof browser !== "undefined" ? browser : chrome).runtime.getURL(
  `options-ui/options-ui.html`,
);
```

## Checking current report data

```javascript
await openWpmPacketHandler.navigationBatchPreprocessor.processQueue();
await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
  openWpmPacketHandler.navigationBatchPreprocessor
    .navigationBatchesByNavigationUuid,
);
```

## Checking current YouTube usage statistics

To check the current usage statistics:

```javascript
await youTubeUsageStatistics.summarizeUpdate();
```

To force re-calculating usage statistics for the currently available navigationBatchesByNavigationUuid
(less than 5 hours old), to see if any errors occur:

```javascript
await openWpmPacketHandler.navigationBatchPreprocessor.processQueue();
await youTubeUsageStatistics.onNavigationBatchesByUuidProcessed(
  openWpmPacketHandler.navigationBatchPreprocessor
    .navigationBatchesByNavigationUuid,
);
await youTubeUsageStatistics.summarizeUpdate();
```

## Export shared data

```javascript
await (await fetch((await exportSharedData()).url)).text();
```

## Collecting traffic data for test fixtures

### NavigationBatchPreprocessor

(Note: Temporarily add the `"<all_urls>",` permission to manifest.json if necessary)

After installing the extension:

1. Clear the current set of collected traffic data and stop scheduled processing:

```javascript
await openWpmPacketHandler.navigationBatchPreprocessor.cleanup();
```

2. Browse around (remember to start with a page reload or direct visit or else no webNavigation is registered)

3. Download the current set of collected navigations:

```javascript
let nbpFixtureFileInfo;
nbpFixtureFileInfo = await triggerClientDownloadOfData(
  openWpmPacketHandler.navigationBatchPreprocessor
    .openWpmPayloadEnvelopeProcessQueue,
  "navigationBatchPreprocessorFixture.json",
);
console.log(nbpFixtureFileInfo.url);
```

In Firefox, the URL above can be opened in a new tab to inspect and save the JSON data. For Chrome, run below to display the JSON:

```javascript
await (await fetch(nbpFixtureFileInfo.url)).text();
```

Restart the browser before collecting data for a new fixture.

### ReportSummarizer

After installing the extension:

1. Clear the current set of collected navigations and stop scheduled processing:

```javascript
await openWpmPacketHandler.navigationBatchPreprocessor.cleanup();
```

2. Browse around (remember to start with a page reload or direct visit or else no webNavigation is registered)

3. Download the current set of collected navigations:

```javascript
await openWpmPacketHandler.navigationBatchPreprocessor.processQueue();
let rsFixtureFileInfo;
rsFixtureFileInfo = await triggerClientDownloadOfData(
  openWpmPacketHandler.navigationBatchPreprocessor
    .navigationBatchesByNavigationUuid,
  "reportSummarizerFixture.json",
);
console.log(rsFixtureFileInfo.url);
```

In Firefox, the URL above can be opened in a new tab to inspect and save the JSON data. For Chrome, run below to display the JSON:

```javascript
await (await fetch(rsFixtureFileInfo.url)).text();
```

Restart the browser before collecting data for a new fixture.

## Generating JSON schema for telemetry ingestion based on typings

```
npx typescript-json-schema tsconfig.json AnnotatedSharedData > telemetry-schema/regrets-reporter-update.1.generated-schema.json
yarn format
```

Then revert the top rows in the schema (since it includes manually added/modified metadata).

## Validating the generated JSON schema

1. Update the corresponding schema files in a local `mozilla-pipeline-schemas` repo. (Export shared data to get valid example payloads).

2. Run:

```
yarn dev-telemetry-server
```

3. Use `TELEMETRY_SERVER=http://localhost` in .env.development.

## Troubleshooting

1. Go to `about:devtools-toolbox?type=extension&id=regrets-reporter%40mozillafoundation.org`
2. Click Console

To clear the current output, click the Trash can icon in the top left.

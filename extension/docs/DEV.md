<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents**

- [Developing this add-on](#developing-this-add-on)
  - [Opening up specific add-on pages](#opening-up-specific-add-on-pages)
  - [Checking current report data](#checking-current-report-data)
  - [Collecting traffic data for test fixtures](#collecting-traffic-data-for-test-fixtures)
    - [NavigationBatchPreprocessor](#navigationbatchpreprocessor)
    - [ReportSummarizer](#reportsummarizer)
  - [Creating a signed build of the add-on](#creating-a-signed-build-of-the-add-on)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Developing this add-on

## Opening up specific add-on pages

From the background context:

```javascript
browser.runtime.getURL(
  `report-regret-form/report-regret-form.html?skipWindowAndTabIdFilter=1`
);
```

```javascript
browser.runtime.getURL(`get-started/get-started.html`);
```

## Checking current report data

```javascript
await openWpmPacketHandler.navigationBatchPreprocessor.processQueue();
await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
  openWpmPacketHandler.navigationBatchPreprocessor
    .navigationBatchesByNavigationUuid
);
```

## Collecting traffic data for test fixtures

### NavigationBatchPreprocessor

(Note: Temporarily add the `"<all_urls>",` permission to manifest.json if necessary)

1. Clear the current set of collected traffic data and stop scheduled processing:

```javascript
await openWpmPacketHandler.navigationBatchPreprocessor.cleanup();
```

2. Browse around (remember to start with a page reload or direct visit or else no webNavigation is registered)

3. Download the current set of collected navigations:

```javascript
await triggerClientDownloadOfData(
  openWpmPacketHandler.navigationBatchPreprocessor
    .openWpmPayloadEnvelopeProcessQueue,
  "navigationBatchPreprocessorFixture.json"
);
```

Restart the browser before collecting data for a new fixture.

### ReportSummarizer

1. Clear the current set of collected navigations:

```javascript
await openWpmPacketHandler.navigationBatchPreprocessor.cleanup();
```

2. Browse around (remember to start with a page reload or direct visit or else no webNavigation is registered)

3. Download the current set of collected navigations:

```javascript
await openWpmPacketHandler.navigationBatchPreprocessor.processQueue();
await triggerClientDownloadOfData(
  openWpmPacketHandler.navigationBatchPreprocessor
    .navigationBatchesByNavigationUuid,
  "reportSummarizerFixture.json"
);
```

Restart the browser before collecting data for a new fixture.

## Creating a signed build of the add-on

After version bumping and setting the API_KEY and API_SECRET env vars:

```
yarn build:production && npx web-ext sign --api-key $API_KEY --api-secret $API_SECRET
```

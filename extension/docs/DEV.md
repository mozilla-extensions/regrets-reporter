# Developing this add-on

## Opening up specific add-on pages

From the background context:

```javascript
browser.runtime.getURL(`popup/report-regret.html`);
```

```javascript
browser.runtime.getURL(`consent-form/consent-form.html`);
```

## Collecting traffic data for test fixtures

### NavigationBatchPreprocessor

(Note: Temporarily add the `"<all_urls>",` permission to manifest.json if necessary)

1. Clear the current set of collected traffic data and stop scheduled processing:

```javascript
await openWpmPacketHandler.navigationBatchPreprocessor.cleanup();
```

2. Browse around

3. Download the current set of collected navigations:

```javascript
await triggerClientDownloadOfData(
  openWpmPacketHandler.navigationBatchPreprocessor
    .openWpmPayloadEnvelopeProcessQueue,
  "navigationBatchPreprocessorFixture.json"
);
```

### ReportSummarizer

1. Clear the current set of collected navigations:

```javascript
await openWpmPacketHandler.navigationBatchPreprocessor.cleanup();
```

2. Browse around

3. Download the current set of collected navigations:

```javascript
await openWpmPacketHandler.navigationBatchPreprocessor.processQueue();
await triggerClientDownloadOfData(
  openWpmPacketHandler.navigationBatchPreprocessor
    .navigationBatchesByNavigationUuid,
  "reportSummarizerFixture.json"
);
```

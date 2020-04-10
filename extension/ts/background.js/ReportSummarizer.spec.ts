import { assert } from "chai";
import { ReportSummarizer } from "./ReportSummarizer";
import { youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo";
import { youtubeVisitWatchPageAndNavigateToFirstUpNext } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndNavigateToFirstUpNext";
import {
  NavigationBatch,
  TrimmedNavigationBatch,
} from "./NavigationBatchPreprocessor";

const trimNavigationBatches = (
  reportSummarizer: ReportSummarizer,
  navigationBatchesByUuid: {
    [navigationUuid: string]: NavigationBatch;
  },
): {
  [navigationUuid: string]: TrimmedNavigationBatch;
} => {
  const navUuids = Object.keys(navigationBatchesByUuid);
  const trimmedNavigationBatchesByUuid: {
    [navigationUuid: string]: TrimmedNavigationBatch;
  } = {};
  for (const navUuid of navUuids) {
    trimmedNavigationBatchesByUuid[
      navUuid
    ] = reportSummarizer.trimNavigationBatch(navigationBatchesByUuid[navUuid]);
  }
  return trimmedNavigationBatchesByUuid;
};

describe("ReportSummarizer", function() {
  it("should exist", async function() {
    const reportSummarizer = new ReportSummarizer();
    assert.isObject(reportSummarizer);
  });

  it("fixture: youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo", async function() {
    const reportSummarizer = new ReportSummarizer();
    const trimmedNavigationBatchesByUuid: {
      [navigationUuid: string]: TrimmedNavigationBatch;
    } = trimNavigationBatches(
      reportSummarizer,
      youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo,
    );

    console.log({ trimmedNavigationBatchesByUuid });

    const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      trimmedNavigationBatchesByUuid,
      "placeholder_extensionInstallationUuid",
    );

    assert.equal(
      youTubeNavigations.length,
      1,
      "should have found one youtube navigation",
    );
  });

  it("fixture: youtubeVisitWatchPageAndNavigateToFirstUpNext", async function() {
    const reportSummarizer = new ReportSummarizer();
    const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      youtubeVisitWatchPageAndNavigateToFirstUpNext,
      "placeholder_extensionInstallationUuid",
    );

    assert.equal(
      youTubeNavigations.length,
      2,
      "should have found two youtube navigations",
    );
  });
});

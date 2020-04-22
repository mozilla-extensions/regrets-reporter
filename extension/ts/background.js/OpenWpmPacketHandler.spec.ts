import { assert } from "chai";
import { ReportSummarizer } from "./ReportSummarizer";
import { OpenWpmPacketHandler } from "./OpenWpmPacketHandler";
import {
  NavigationBatch,
  TrimmedNavigationBatch,
} from "./NavigationBatchPreprocessor";
import { ActiveTabDwellTimeMonitor } from "./ActiveTabDwellTimeMonitor";

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

const activeTabDwellTimeMonitor = new ActiveTabDwellTimeMonitor();

describe("OpenWpmPacketHandler", function() {
  it("should exist", async function() {
    const openWpmPacketHandler = new OpenWpmPacketHandler(
      activeTabDwellTimeMonitor,
    );
    assert.isObject(openWpmPacketHandler);
  });

  it("fixture: youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo", async function() {
    const reportSummarizer = new ReportSummarizer();
    const trimmedNavigationBatchesByUuid: {
      [navigationUuid: string]: TrimmedNavigationBatch;
    } = trimNavigationBatches(reportSummarizer, {});

    // console.log({ trimmedNavigationBatchesByUuid });
  });
});

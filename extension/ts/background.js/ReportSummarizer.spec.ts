import { assert } from "chai";
import { ReportSummarizer } from "./ReportSummarizer";
import { youtubeVisitAndStartPlaying10hOfSilenceVideo } from "./fixtures/ReportSummarizer/youtubeVisitAndStartPlaying10hOfSilenceVideo";

describe("ReportSummarizer", function() {
  it("should exist", function() {
    const reportSummarizer = new ReportSummarizer();
    assert.isObject(reportSummarizer);
  });

  describe("youtubeVisit10hOfSilenceVideo", async function() {
    const reportSummarizer = new ReportSummarizer();
    const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      youtubeVisitAndStartPlaying10hOfSilenceVideo,
    );

    describe("foo", function() {
      it("should have found one youtube navigation", async function() {
        console.log({ youTubeNavigations });
        assert.isTrue(false);
      });
    });
  });
});

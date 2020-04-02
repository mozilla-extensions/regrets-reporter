import { assert } from "chai";
import { ReportSummarizer } from "./ReportSummarizer";
import { youtubeVisitAndStartPlaying10hOfSilenceVideo } from "./fixtures/ReportSummarizer/youtubeVisitAndStartPlaying10hOfSilenceVideo";

describe("ReportSummarizer", function() {
  it("should exist", function() {
    const reportSummarizer = new ReportSummarizer();
    assert.isObject(reportSummarizer);
  });

  describe("Visiting YouTube", async function() {
    const reportSummarizer = new ReportSummarizer();

    describe("fixture: youtubeVisit10hOfSilenceVideo", async function() {
      const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
        youtubeVisitAndStartPlaying10hOfSilenceVideo,
        "placeholder_extensionInstallationUuid",
      );

      it("should have found one youtube navigation", async function() {
        assert.equal(youTubeNavigations.length, 1);
      });
    });
  });
});

import { assert } from "chai";
import { ReportSummarizer } from "./ReportSummarizer";
import { youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo";
import { youtubeVisitWatchPageAndNavigateToFirstUpNext } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndNavigateToFirstUpNext";

describe("ReportSummarizer", function() {
  it("should exist", async function() {
    const reportSummarizer = new ReportSummarizer();
    assert.isObject(reportSummarizer);
  });

  it("fixture: youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo", async function() {
    const reportSummarizer = new ReportSummarizer();
    const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo,
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
    );

    assert.equal(
      youTubeNavigations.length,
      2,
      "should have found two youtube navigations",
    );

    console.dir({ youTubeNavigations }, { depth: 5 });

    assert.deepEqual(
      youTubeNavigations[0].how_the_youtube_navigation_likely_was_reached,
      ["page_reload"],
    );
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    assert.deepEqual(
      youTubeNavigations[1].how_the_youtube_navigation_likely_was_reached,
      ["watch_next_column"],
    );
    assert.equal(youTubeNavigations[1].parent_youtube_navigations.length, 1);

    const regretReport1 = await reportSummarizer.regretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
    );
    assert.deepEqual(regretReport1, {
      regretted_youtube_navigation_video_metadata: {
        video_id: "foo",
        video_title: "foo",
        video_description: "",
        video_posting_date: "",
        view_count_at_navigation: -1,
        view_count_at_navigation_short: "",
      },
      how_this_and_recent_youtube_navigations_were_reached: [],
    });

    const regretReport2 = await reportSummarizer.regretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
    );
    assert.deepEqual(regretReport2, {
      regretted_youtube_navigation_video_metadata: {
        video_id: "foo",
        video_title: "foo",
        video_description: "",
        video_posting_date: "",
        view_count_at_navigation: -1,
        view_count_at_navigation_short: "",
      },
      how_this_and_recent_youtube_navigations_were_reached: [],
    });
  });
});

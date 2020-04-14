import { assert } from "chai";
import { ReportSummarizer } from "./ReportSummarizer";
import { youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo";
import { youtubeVisitWatchPageAndNavigateToFirstUpNext } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndNavigateToFirstUpNext";
import { youtubeVisitMainPageAndBrowseAround } from "./fixtures/ReportSummarizer/youtubeVisitMainPageAndBrowseAround";

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

    console.dir({ youTubeNavigations }, { depth: 5 });
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
    /*
    assert.deepEqual(
      youTubeNavigations[1].how_the_youtube_navigation_likely_was_reached,
      ["watch_next_column"],
    );
    assert.equal(youTubeNavigations[1].parent_youtube_navigations.length, 1);
    */

    const regretReport1 = await reportSummarizer.regretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
    );
    assert.deepEqual(regretReport1, {
      regretted_youtube_navigation_video_metadata: {
        video_id: "g4mHPeMGTJM",
        video_title: "10 hours of absolute silence (the original)",
        video_description:
          "10 hours of comfortable silence. Only watch the original, everything else may contain sound ;-)",
        video_posting_date: "Sep 20, 2011",
        view_count_at_navigation: 4158462,
        view_count_at_navigation_short: "4.1M views",
      },
      how_this_and_recent_youtube_navigations_were_reached: [],
    });

    const regretReport2 = await reportSummarizer.regretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
    );
    assert.deepEqual(regretReport2, {
      regretted_youtube_navigation_video_metadata: {
        video_description: "24 hours of nothing",
        video_id: "yh9DSyWI2ks",
        video_posting_date: "Sep 12, 2016",
        video_title: "24 hours of nothing",
        view_count_at_navigation: 1359093,
        view_count_at_navigation_short: "1.3M views",
      },
      how_this_and_recent_youtube_navigations_were_reached: [],
    });
  });

  it("fixture: youtubeVisitMainPageAndBrowseAround", async function() {
    const reportSummarizer = new ReportSummarizer();
    const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      youtubeVisitMainPageAndBrowseAround,
    );

    assert.equal(
      youTubeNavigations.length,
      11,
      "should have found two youtube navigations",
    );

    console.dir({ youTubeNavigations }, { depth: 5 });

    assert.deepEqual(
      youTubeNavigations[0].how_the_youtube_navigation_likely_was_reached,
      ["direct_navigation"],
    );
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    /*
    assert.deepEqual(
      youTubeNavigations[1].how_the_youtube_navigation_likely_was_reached,
      ["watch_next_column"],
    );
    assert.equal(youTubeNavigations[1].parent_youtube_navigations.length, 1);
    */

    const regretReport1 = await reportSummarizer.regretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
    );
    assert.deepEqual(regretReport1, {
      regretted_youtube_navigation_video_metadata: {
        video_description:
          "Miten se on niin hankalaa muistaa nimiä, ylipäätään kuunnella niitä, ja etenkin selvittää.\n\nDVD:t ja muut tuotteet:\n",
        video_id: "oVHNwHkYSQg",
        video_posting_date: "Apr 3, 2020",
        video_title: "ISMO | Ja nimi oli",
        view_count_at_navigation: 265681,
        view_count_at_navigation_short: "265K views",
      },
      how_this_and_recent_youtube_navigations_were_reached: [],
    });

    const regretReport2 = await reportSummarizer.regretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
    );
    assert.deepEqual(regretReport2, {
      regretted_youtube_navigation_video_metadata: undefined,
      how_this_and_recent_youtube_navigations_were_reached: [],
    });
  });
});

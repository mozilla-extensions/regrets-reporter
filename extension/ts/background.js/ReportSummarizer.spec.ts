import { assert } from "chai";
import { ReportSummarizer } from "./ReportSummarizer";
import { youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo";
import { youtubeVisitWatchPageAndNavigateToFirstUpNext } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndNavigateToFirstUpNext";
import { youtubeVisitMainPageAndBrowseAround } from "./fixtures/ReportSummarizer/youtubeVisitMainPageAndBrowseAround";
import { youtubeVisitWatchPageAndInteractWithEndScreens } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndInteractWithEndScreens";

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

    // console.dir({ youTubeNavigations }, { depth: 5 });
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

    // console.dir({ youTubeNavigations }, { depth: 5 });

    assert.deepEqual(youTubeNavigations[0].youtube_visit_metadata, {
      reach_type: "direct_navigation",
      url_type: "watch_page",
      referrer_url_type: "empty",
    });
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    assert.deepEqual(youTubeNavigations[1].youtube_visit_metadata, {
      reach_type: "watch_next_column",
      url_type: "watch_page",
      referrer_url_type: "watch_page",
    });
    assert.equal(youTubeNavigations[1].parent_youtube_navigations.length, 1);

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
        view_count_at_navigation: 4173534,
        view_count_at_navigation_short: "4.1M views",
      },
      youtube_browsing_history_metadata: [
        {
          reach_type: "direct_navigation",
          url_type: "watch_page",
          referrer_url_type: "empty",
        },
      ],
    });

    const regretReport2 = await reportSummarizer.regretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
    );
    assert.deepEqual(regretReport2, {
      regretted_youtube_navigation_video_metadata: {
        video_description: "http://billwurtz.com",
        video_id: "xuCn8ux2gbs",
        video_posting_date: "May 10, 2017",
        video_title: "history of the entire world, i guess",
        view_count_at_navigation: 86023815,
        view_count_at_navigation_short: "86M views",
      },
      youtube_browsing_history_metadata: [
        {
          reach_type: "watch_next_column",
          url_type: "watch_page",
          referrer_url_type: "watch_page",
        },
        {
          reach_type: "direct_navigation",
          url_type: "watch_page",
          referrer_url_type: "empty",
        },
      ],
    });
  });

  it("fixture: youtubeVisitWatchPageAndInteractWithEndScreens", async function() {
    const reportSummarizer = new ReportSummarizer();
    const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      youtubeVisitWatchPageAndInteractWithEndScreens,
    );

    assert.equal(
      youTubeNavigations.length,
      2,
      "should have found two youtube navigations",
    );

    // console.dir({ youTubeNavigations }, { depth: 5 });

    assert.deepEqual(youTubeNavigations[0].youtube_visit_metadata, {
      reach_type: "direct_navigation",
      url_type: "watch_page",
      referrer_url_type: "empty",
    });
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    assert.deepEqual(youTubeNavigations[1].youtube_visit_metadata, {
      reach_type: "watch_next_end_screen",
      url_type: "watch_page",
      referrer_url_type: "watch_page",
    });
    assert.equal(youTubeNavigations[1].parent_youtube_navigations.length, 1);

    const regretReport1 = await reportSummarizer.regretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
    );
    assert.deepEqual(regretReport1, {
      regretted_youtube_navigation_video_metadata: {
        video_description:
          "Provided to YouTube by TuneCore\n\nMoonlight Sonata · Beethoven\n\nMoonlight Sonata\n\n℗ 2014 Moonlight Sonata\n\nReleased on: 2011-04-27\n\nAuto-generated by YouTube.",
        video_id: "9_C6CTs0WhI",
        video_posting_date: "May 8, 2014",
        video_title: "Moonlight Sonata",
        view_count_at_navigation: 339321,
        view_count_at_navigation_short: "339K views",
      },
      youtube_browsing_history_metadata: [
        {
          reach_type: "direct_navigation",
          url_type: "watch_page",
          referrer_url_type: "empty",
        },
      ],
    });

    const regretReport2 = await reportSummarizer.regretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
    );
    assert.deepEqual(regretReport2, {
      regretted_youtube_navigation_video_metadata: {
        video_description:
          "Provided to YouTube by The Orchard Enterprises\n\nNocturne No. 2 in E flat Major, Op. 9,2 · Frédéric Chopin\n\nChopin\n\n℗ 2009 One Media Publishing\n\nReleased on: 2009-08-17\n\nAuto-generated by YouTube.",
        video_id: "bVeOdm-29pU",
        video_posting_date: "Nov 9, 2014",
        video_title: "Nocturne No. 2 in E flat Major, Op. 9,2",
        view_count_at_navigation: 2423769,
        view_count_at_navigation_short: "2.4M views",
      },
      youtube_browsing_history_metadata: [
        {
          reach_type: "watch_next_end_screen",
          url_type: "watch_page",
          referrer_url_type: "watch_page",
        },
        {
          reach_type: "direct_navigation",
          url_type: "watch_page",
          referrer_url_type: "empty",
        },
      ],
    });
  });

  it.skip("fixture: youtubeVisitMainPageAndBrowseAround", async function() {
    const reportSummarizer = new ReportSummarizer();
    const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      youtubeVisitMainPageAndBrowseAround,
    );

    assert.equal(
      youTubeNavigations.length,
      11,
      "should have found two youtube navigations",
    );

    // console.dir({ youTubeNavigations }, { depth: 5 });

    assert.deepEqual(youTubeNavigations[0].youtube_visit_metadata, {
      reach_type: "direct_navigation",
      url_type: "watch_page",
      referrer_url_type: "empty",
    });
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    assert.deepEqual(youTubeNavigations[1].youtube_visit_metadata, {
      reach_type: "watch_next_column",
      url_type: "watch_page",
      referrer_url_type: "watch_page",
    });
    assert.equal(youTubeNavigations[1].parent_youtube_navigations.length, 1);

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
      youtube_browsing_history_metadata: [
        {
          reach_type: "direct_navigation",
          url_type: "watch_page",
          referrer_url_type: "empty",
        },
      ],
    });

    const regretReport2 = await reportSummarizer.regretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
    );
    assert.deepEqual(regretReport2, {
      regretted_youtube_navigation_video_metadata: undefined,
      youtube_browsing_history_metadata: [
        {
          reach_type: "search_action",
          url_type: "watch_page",
          referrer_url_type: "watch_page",
        },
        {
          reach_type: "direct_navigation",
          url_type: "watch_page",
          referrer_url_type: "empty",
        },
      ],
    });
  });
});

import { assert } from "chai";
import { ReportSummarizer } from "./ReportSummarizer";
import { youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo";
import { youtubeVisitWatchPageAndNavigateToFirstUpNext } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndNavigateToFirstUpNext";
import { youtubeVisitMainPageAndBrowseAround } from "./fixtures/ReportSummarizer/youtubeVisitMainPageAndBrowseAround";
import { youtubeVisitWatchPageAndInteractWithEndScreens } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndInteractWithEndScreens";
import { TrimmedNavigationBatch } from "./NavigationBatchPreprocessor";
import { youtubeVisitWatchPageAndNavigateToChannelPageThenWatchPage } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndNavigateToChannelPageThenWatchPage";

const firstEncounteredWindowAndTabIds = (navigationBatchesByUuid: {
  [navigationUuid: string]: TrimmedNavigationBatch;
}) => {
  const firstNavigationBatchWithWindowAndTabIdUuid = Object.keys(
    navigationBatchesByUuid,
  ).find(
    navUuid =>
      !!navigationBatchesByUuid[navUuid].navigationEnvelope.navigation
        .window_id &&
      !!navigationBatchesByUuid[navUuid].navigationEnvelope.navigation.tab_id,
  );
  const firstNavigationBatchWithWindowAndTabId =
    navigationBatchesByUuid[firstNavigationBatchWithWindowAndTabIdUuid];
  return {
    windowId:
      firstNavigationBatchWithWindowAndTabId.navigationEnvelope.navigation
        .window_id,
    tabId:
      firstNavigationBatchWithWindowAndTabId.navigationEnvelope.navigation
        .tab_id,
  };
};

describe("ReportSummarizer", function() {
  it("should exist", async function() {
    const reportSummarizer = new ReportSummarizer();
    assert.isObject(reportSummarizer);
  });

  it("fixture: youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo", async function() {
    const reportSummarizer = new ReportSummarizer();
    const fixture = youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo;
    const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      fixture,
    );

    assert.equal(
      youTubeNavigations.length,
      1,
      "should have found one youtube navigation",
    );

    // console.dir({ youTubeNavigations }, { depth: 5 });

    const windowAndTabIds1 = firstEncounteredWindowAndTabIds(fixture);
    const youTubeNavigationSpecificRegretReportData1 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
      windowAndTabIds1.windowId,
      windowAndTabIds1.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData1, {
      video_metadata: {
        video_id: "g4mHPeMGTJM",
        video_title: "10 hours of absolute silence (the original)",
        video_description:
          "10 hours of comfortable silence. Only watch the original, everything else may contain sound ;-)",
        video_posting_date: "Sep 20, 2011",
        view_count_at_navigation: 4173530,
        view_count_at_navigation_short: "4.1M views",
      },
      how_the_video_was_reached: [
        {
          reach_type: "page_reload",
          url_type: "watch_page",
          referrer_url_type: "empty",
        },
      ],
    });
  });

  it("fixture: youtubeVisitWatchPageAndNavigateToFirstUpNext", async function() {
    const reportSummarizer = new ReportSummarizer();
    const fixture = youtubeVisitWatchPageAndNavigateToFirstUpNext;
    const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      fixture,
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

    const windowAndTabIds1 = firstEncounteredWindowAndTabIds(fixture);
    const youTubeNavigationSpecificRegretReportData1 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
      windowAndTabIds1.windowId,
      windowAndTabIds1.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData1, {
      video_metadata: {
        video_id: "g4mHPeMGTJM",
        video_title: "10 hours of absolute silence (the original)",
        video_description:
          "10 hours of comfortable silence. Only watch the original, everything else may contain sound ;-)",
        video_posting_date: "Sep 20, 2011",
        view_count_at_navigation: 4173534,
        view_count_at_navigation_short: "4.1M views",
      },
      how_the_video_was_reached: [
        {
          reach_type: "direct_navigation",
          url_type: "watch_page",
          referrer_url_type: "empty",
        },
      ],
    });

    const windowAndTabIds2 = firstEncounteredWindowAndTabIds(fixture);
    const youTubeNavigationSpecificRegretReportData2 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
      windowAndTabIds2.windowId,
      windowAndTabIds2.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData2, {
      video_metadata: {
        video_description: "http://billwurtz.com",
        video_id: "xuCn8ux2gbs",
        video_posting_date: "May 10, 2017",
        video_title: "history of the entire world, i guess",
        view_count_at_navigation: 86023815,
        view_count_at_navigation_short: "86M views",
      },
      how_the_video_was_reached: [
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
    const fixture = youtubeVisitWatchPageAndInteractWithEndScreens;
    const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      fixture,
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

    const windowAndTabIds1 = firstEncounteredWindowAndTabIds(fixture);
    const youTubeNavigationSpecificRegretReportData1 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
      windowAndTabIds1.windowId,
      windowAndTabIds1.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData1, {
      video_metadata: {
        video_description:
          "Provided to YouTube by TuneCore\n\nMoonlight Sonata · Beethoven\n\nMoonlight Sonata\n\n℗ 2014 Moonlight Sonata\n\nReleased on: 2011-04-27\n\nAuto-generated by YouTube.",
        video_id: "9_C6CTs0WhI",
        video_posting_date: "May 8, 2014",
        video_title: "Moonlight Sonata",
        view_count_at_navigation: 339321,
        view_count_at_navigation_short: "339K views",
      },
      how_the_video_was_reached: [
        {
          reach_type: "direct_navigation",
          url_type: "watch_page",
          referrer_url_type: "empty",
        },
      ],
    });

    const windowAndTabIds2 = firstEncounteredWindowAndTabIds(fixture);
    const youTubeNavigationSpecificRegretReportData2 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
      windowAndTabIds2.windowId,
      windowAndTabIds2.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData2, {
      video_metadata: {
        video_description:
          "Provided to YouTube by The Orchard Enterprises\n\nNocturne No. 2 in E flat Major, Op. 9,2 · Frédéric Chopin\n\nChopin\n\n℗ 2009 One Media Publishing\n\nReleased on: 2009-08-17\n\nAuto-generated by YouTube.",
        video_id: "bVeOdm-29pU",
        video_posting_date: "Nov 9, 2014",
        video_title: "Nocturne No. 2 in E flat Major, Op. 9,2",
        view_count_at_navigation: 2423769,
        view_count_at_navigation_short: "2.4M views",
      },
      how_the_video_was_reached: [
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

  it("fixture: youtubeVisitWatchPageAndNavigateToChannelPageThenWatchPage", async function() {
    const reportSummarizer = new ReportSummarizer();
    const fixture = youtubeVisitWatchPageAndNavigateToChannelPageThenWatchPage;
    const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      fixture,
    );
    const windowAndTabIds = firstEncounteredWindowAndTabIds(fixture);

    assert.equal(
      youTubeNavigations.length,
      3,
      "should have found two youtube navigations",
    );

    // console.dir({ youTubeNavigations }, { depth: 5 });

    assert.deepEqual(youTubeNavigations[0].youtube_visit_metadata, {
      reach_type: "page_reload",
      url_type: "watch_page",
      referrer_url_type: "empty",
    });
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    assert.deepEqual(youTubeNavigations[1].youtube_visit_metadata, {
      reach_type:
        "from_watch_page_without_clicking_neither_up_next_nor_end_screen",
      url_type: "channel_page",
      referrer_url_type: "watch_page",
    });
    assert.equal(youTubeNavigations[1].parent_youtube_navigations.length, 1);

    const youTubeNavigationSpecificRegretReportData1 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData1, {
      video_metadata: {
        video_description:
          "10 hours of comfortable silence. Only watch the original, everything else may contain sound ;-)",
        video_id: "g4mHPeMGTJM",
        video_posting_date: "Sep 20, 2011",
        video_title: "10 hours of absolute silence (the original)",
        view_count_at_navigation: 4200329,
        view_count_at_navigation_short: "4.2M views",
      },
      how_the_video_was_reached: [
        {
          reach_type: "page_reload",
          url_type: "watch_page",
          referrer_url_type: "empty",
        },
      ],
    });

    const youTubeNavigationSpecificRegretReportData2 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData2, {
      video_metadata: undefined,
      how_the_video_was_reached: [
        {
          reach_type:
            "from_watch_page_without_clicking_neither_up_next_nor_end_screen",
          url_type: "channel_page",
          referrer_url_type: "watch_page",
        },
        {
          reach_type: "page_reload",
          url_type: "watch_page",
          referrer_url_type: "empty",
        },
      ],
    });

    const youTubeNavigationSpecificRegretReportData3 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 3),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData3, {
      video_metadata: {
        video_description:
          "10 hours of comfortable silence. Only watch the original, everything else may contain sound ;-)",
        video_id: "g4mHPeMGTJM",
        video_posting_date: "Sep 20, 2011",
        video_title: "10 hours of absolute silence (the original)",
        view_count_at_navigation: 4200329,
        view_count_at_navigation_short: "4.2M views",
      },
      how_the_video_was_reached: [
        {
          reach_type: "unspecified_navigation",
          url_type: "watch_page",
          referrer_url_type: "channel_page",
        },
        {
          reach_type:
            "from_watch_page_without_clicking_neither_up_next_nor_end_screen",
          url_type: "channel_page",
          referrer_url_type: "watch_page",
        },
        {
          reach_type: "page_reload",
          url_type: "watch_page",
          referrer_url_type: "empty",
        },
      ],
    });
  });

  it.skip("fixture: youtubeVisitMainPageAndBrowseAround", async function() {
    const reportSummarizer = new ReportSummarizer();
    const fixture = youtubeVisitMainPageAndBrowseAround;
    const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      fixture,
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

    const windowAndTabIds1 = firstEncounteredWindowAndTabIds(fixture);
    const youTubeNavigationSpecificRegretReportData1 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
      windowAndTabIds1.windowId,
      windowAndTabIds1.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData1, {
      video_metadata: {
        video_description:
          "Miten se on niin hankalaa muistaa nimiä, ylipäätään kuunnella niitä, ja etenkin selvittää.\n\nDVD:t ja muut tuotteet:\n",
        video_id: "oVHNwHkYSQg",
        video_posting_date: "Apr 3, 2020",
        video_title: "ISMO | Ja nimi oli",
        view_count_at_navigation: 265681,
        view_count_at_navigation_short: "265K views",
      },
      how_the_video_was_reached: [
        {
          reach_type: "direct_navigation",
          url_type: "watch_page",
          referrer_url_type: "empty",
        },
      ],
    });

    const windowAndTabIds2 = firstEncounteredWindowAndTabIds(fixture);
    const youTubeNavigationSpecificRegretReportData2 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
      windowAndTabIds2.windowId,
      windowAndTabIds2.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData2, {
      video_metadata: undefined,
      how_the_video_was_reached: [
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

import { assert } from "chai";
import { ReportSummarizer } from "./ReportSummarizer";
import { youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo";
import { youtubeVisitWatchPageAndNavigateToFirstUpNext } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndNavigateToFirstUpNext";
import { youtubeVisitWatchPageAndInteractWithEndScreens } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndInteractWithEndScreens";
import { TrimmedNavigationBatch } from "./NavigationBatchPreprocessor";
import { youtubeVisitWatchPageAndNavigateToChannelPageThenWatchPage } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndNavigateToChannelPageThenWatchPage";
import { youtubeVisitWatchPageOfADifferentType } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageOfADifferentType";
import { youtubeVisitMainPageSearchClickUserClickVideo } from "./fixtures/ReportSummarizer/youtubeVisitMainPageSearchClickUserClickVideo";

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
      page_entry_point: "page_reload",
      url_type: "watch_page",
      parent_youtube_navigation_metadata: [],
    });
  });

  it("fixture: youtubeVisitWatchPageOfADifferentType", async function() {
    const reportSummarizer = new ReportSummarizer();
    const fixture = youtubeVisitWatchPageOfADifferentType;
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
        video_description:
          "As the world struggles to contain the coronavirus pandemic, many have started claiming how this calamity was predicted centuries ago. Sadhguru busts the myth.\n\nDonate towards Corona relief at\n",
        video_id: "P4QP6c8WmKc",
        video_posting_date: "Apr 15, 2020",
        video_title:
          "Was the Corona Pandemic Predicted Centuries Ago? - Sadhguru",
        view_count_at_navigation: 315911,
        view_count_at_navigation_short: "315K views",
      },
      page_entry_point: "direct_navigation",
      url_type: "watch_page",
      parent_youtube_navigation_metadata: [],
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
    });
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    assert.deepEqual(youTubeNavigations[1].youtube_visit_metadata, {
      reach_type: "from_watch_page_up_next_column_click",
      url_type: "watch_page",
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
      page_entry_point: "direct_navigation",
      url_type: "watch_page",
      parent_youtube_navigation_metadata: [],
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
      page_entry_point: "watch_page",
      url_type: "watch_page",
      parent_youtube_navigation_metadata: [
        {
          video_metadata: {
            video_id: "g4mHPeMGTJM",
            video_title: "10 hours of absolute silence (the original)",
            video_description:
              "10 hours of comfortable silence. Only watch the original, everything else may contain sound ;-)",
            video_posting_date: "Sep 20, 2011",
            view_count_at_navigation: 4173534,
            view_count_at_navigation_short: "4.1M views",
          },
          page_entry_point: "direct_navigation",
          url_type: "watch_page",
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
    });
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    assert.deepEqual(youTubeNavigations[1].youtube_visit_metadata, {
      reach_type: "from_watch_page_watch_next_end_screen_click",
      url_type: "watch_page",
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
      page_entry_point: "direct_navigation",
      url_type: "watch_page",
      parent_youtube_navigation_metadata: [],
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
      page_entry_point: "watch_page",
      url_type: "watch_page",
      parent_youtube_navigation_metadata: [
        {
          video_metadata: {
            video_description:
              "Provided to YouTube by TuneCore\n\nMoonlight Sonata · Beethoven\n\nMoonlight Sonata\n\n℗ 2014 Moonlight Sonata\n\nReleased on: 2011-04-27\n\nAuto-generated by YouTube.",
            video_id: "9_C6CTs0WhI",
            video_posting_date: "May 8, 2014",
            video_title: "Moonlight Sonata",
            view_count_at_navigation: 339321,
            view_count_at_navigation_short: "339K views",
          },
          page_entry_point: "direct_navigation",
          url_type: "watch_page",
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
    });
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    assert.deepEqual(youTubeNavigations[1].youtube_visit_metadata, {
      reach_type:
        "from_watch_page_without_clicking_neither_up_next_nor_end_screen",
      url_type: "channel_page",
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
      page_entry_point: "page_reload",
      url_type: "watch_page",
      parent_youtube_navigation_metadata: [],
    });

    const youTubeNavigationSpecificRegretReportData2 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData2, {
      url_type: "channel_page",
      page_entry_point: "watch_page",
      parent_youtube_navigation_metadata: [
        {
          video_metadata: {
            video_description:
              "10 hours of comfortable silence. Only watch the original, everything else may contain sound ;-)",
            video_id: "g4mHPeMGTJM",
            video_posting_date: "Sep 20, 2011",
            video_title: "10 hours of absolute silence (the original)",
            view_count_at_navigation: 4200329,
            view_count_at_navigation_short: "4.2M views",
          },
          page_entry_point: "page_reload",
          url_type: "watch_page",
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
      page_entry_point: "channel_page",
      url_type: "watch_page",
      parent_youtube_navigation_metadata: [
        {
          page_entry_point: "watch_page",
          url_type: "channel_page",
        },
        {
          video_metadata: {
            video_description:
              "10 hours of comfortable silence. Only watch the original, everything else may contain sound ;-)",
            video_id: "g4mHPeMGTJM",
            video_posting_date: "Sep 20, 2011",
            video_title: "10 hours of absolute silence (the original)",
            view_count_at_navigation: 4200329,
            view_count_at_navigation_short: "4.2M views",
          },
          page_entry_point: "page_reload",
          url_type: "watch_page",
        },
      ],
    });
  });

  it("fixture: youtubeVisitMainPageSearchClickUserClickVideo", async function() {
    const reportSummarizer = new ReportSummarizer();
    const fixture = youtubeVisitMainPageSearchClickUserClickVideo;
    const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      fixture,
    );
    const windowAndTabIds = firstEncounteredWindowAndTabIds(fixture);

    assert.equal(
      youTubeNavigations.length,
      4,
      "should have found youtube navigations",
    );

    // console.dir({ youTubeNavigations }, { depth: 5 });

    assert.deepEqual(youTubeNavigations[0].youtube_visit_metadata, {
      reach_type: "direct_navigation",
      url_type: "youtube_main_page",
    });
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    assert.deepEqual(youTubeNavigations[1].youtube_visit_metadata, {
      reach_type: "unspecified_navigation",
      url_type: "search_results_page",
    });
    assert.equal(youTubeNavigations[1].parent_youtube_navigations.length, 1);

    const youTubeNavigationSpecificRegretReportData1 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData1, {
      page_entry_point: "direct_navigation",
      url_type: "youtube_main_page",
      parent_youtube_navigation_metadata: [],
    });

    const youTubeNavigationSpecificRegretReportData2 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData2, {
      page_entry_point: "youtube_main_page",
      url_type: "search_results_page",
      parent_youtube_navigation_metadata: [
        {
          page_entry_point: "direct_navigation",
          url_type: "youtube_main_page",
        },
      ],
    });

    const youTubeNavigationSpecificRegretReportData3 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 3),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData3, {
      page_entry_point: "search_results_page",
      url_type: "user_page",
      parent_youtube_navigation_metadata: [
        {
          page_entry_point: "youtube_main_page",
          url_type: "search_results_page",
        },
        {
          page_entry_point: "direct_navigation",
          url_type: "youtube_main_page",
        },
      ],
    });

    const youTubeNavigationSpecificRegretReportData4 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 4),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData4, {
      video_metadata: {
        video_description:
          "Cal Jam 18 took place October 6, 2018 in San Bernardino, CA. \nSIGN UP FOR MORE INFO ON FUTURE EVENTS: ",
        video_id: "PdDpbKX-N-4",
        video_posting_date: "Feb 28, 2020",
        video_title: "Cal Jam 18 - More Good Times!",
        view_count_at_navigation: 31958,
        view_count_at_navigation_short: "31K views",
      },
      page_entry_point: "user_page",
      url_type: "watch_page",
      parent_youtube_navigation_metadata: [
        {
          page_entry_point: "search_results_page",
          url_type: "user_page",
        },
        {
          page_entry_point: "youtube_main_page",
          url_type: "search_results_page",
        },
        {
          page_entry_point: "direct_navigation",
          url_type: "youtube_main_page",
        },
      ],
    });
  });
});

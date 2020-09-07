import { assert } from "chai";
import { ReportSummarizer } from "./ReportSummarizer";
import { youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo";
import { youtubeVisitWatchPageAndNavigateToFirstUpNext } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndNavigateToFirstUpNext";
import { youtubeVisitWatchPageAndInteractWithEndScreens } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndInteractWithEndScreens";
import { TrimmedNavigationBatchesByUuid } from "./NavigationBatchPreprocessor";
import { youtubeVisitWatchPageAndNavigateToChannelPageThenWatchPage } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndNavigateToChannelPageThenWatchPage";
import { youtubeVisitWatchPageOfADifferentType } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageOfADifferentType";
import { youtubeVisitMainPageSearchClickUserClickVideo } from "./fixtures/ReportSummarizer/youtubeVisitMainPageSearchClickUserClickVideo";
import { youtubeVisitWatchPageAndSearchClickUserSearchResultVideo } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndSearchClickUserSearchResultVideo";
import { youtubeVisitWatchPageChangeTabSwitchBackAndPlayVideoForAWhile } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageChangeTabSwitchBackAndPlayVideoForAWhile";
import { youtubeVisitWatchPageChrome20200820 } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageChrome20200820";

const firstEncounteredWindowAndTabIds = (
  navigationBatchesByUuid: TrimmedNavigationBatchesByUuid,
) => {
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
      youtube_navigation_metadata: {
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
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [],
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
      youtube_navigation_metadata: {
        video_metadata: {
          video_description:
            "As the world struggles to contain the coronavirus pandemic, many have started claiming how this calamity was predicted centuries ago. Sadhguru busts the myth.\n\nDonate towards Corona relief at\n[http://ishaoutreach.org/corona-relief](/redirect?v=P4QP6c8WmKc&redir_token=9k-toAqUx0qYWuR1ek8XiQlJyMl8MTU4NzgxNTYwM0AxNTg3NzI5MjAz&event=video_description&q=http%3A%2F%2Fishaoutreach.org%2Fcorona-relief)\n\nDownload Sadhguru App 📲\n[http://onelink.to/sadhguru__app](/redirect?v=P4QP6c8WmKc&redir_token=9k-toAqUx0qYWuR1ek8XiQlJyMl8MTU4NzgxNTYwM0AxNTg3NzI5MjAz&event=video_description&q=http%3A%2F%2Fonelink.to%2Fsadhguru__app)\n\nYogi, mystic and visionary, Sadhguru is a spiritual master with a difference. An arresting blend of profundity and pragmatism, his life and work serves as a reminder that yoga is a contemporary science, vitally relevant to our times. \n\nSubscribe to Sadhguru YouTube Channel Here:\n[https://youtube.com/user/sadhguru?sub...](https://youtube.com/user/sadhguru?sub_confirmation=1)\n\nOfficial Sadhguru Website\n[http://isha.sadhguru.org](/redirect?v=P4QP6c8WmKc&redir_token=9k-toAqUx0qYWuR1ek8XiQlJyMl8MTU4NzgxNTYwM0AxNTg3NzI5MjAz&event=video_description&q=http%3A%2F%2Fisha.sadhguru.org)\n\nOfficial Social Profiles of [#Sadhguru](/results?search_query=%23Sadhguru)\n[https://facebook.com/sadhguru](/redirect?v=P4QP6c8WmKc&redir_token=9k-toAqUx0qYWuR1ek8XiQlJyMl8MTU4NzgxNTYwM0AxNTg3NzI5MjAz&event=video_description&q=https%3A%2F%2Ffacebook.com%2Fsadhguru)\n[https://instagram.com/sadhguru](/redirect?v=P4QP6c8WmKc&redir_token=9k-toAqUx0qYWuR1ek8XiQlJyMl8MTU4NzgxNTYwM0AxNTg3NzI5MjAz&event=video_description&q=https%3A%2F%2Finstagram.com%2Fsadhguru)\n[https://twitter.com/SadhguruJV](/redirect?v=P4QP6c8WmKc&redir_token=9k-toAqUx0qYWuR1ek8XiQlJyMl8MTU4NzgxNTYwM0AxNTg3NzI5MjAz&event=video_description&q=https%3A%2F%2Ftwitter.com%2FSadhguruJV)\n\nFree Online Guided Yoga & Meditation by Sadhguru\n[http://isha.sadhguru.org/5-min-practices](/redirect?v=P4QP6c8WmKc&redir_token=9k-toAqUx0qYWuR1ek8XiQlJyMl8MTU4NzgxNTYwM0AxNTg3NzI5MjAz&event=video_description&q=http%3A%2F%2Fisha.sadhguru.org%2F5-min-practices)\n[http://isha.sadhguru.org/IshaKriya](/redirect?v=P4QP6c8WmKc&redir_token=9k-toAqUx0qYWuR1ek8XiQlJyMl8MTU4NzgxNTYwM0AxNTg3NzI5MjAz&event=video_description&q=http%3A%2F%2Fisha.sadhguru.org%2FIshaKriya)",
          video_id: "P4QP6c8WmKc",
          video_posting_date: "Apr 15, 2020",
          video_title:
            "Was the Corona Pandemic Predicted Centuries Ago? - Sadhguru",
          view_count_at_navigation: 315911,
          view_count_at_navigation_short: "315K views",
        },
        page_entry_point: "direct_navigation",
        url_type: "watch_page",
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [],
    });
  });

  it("fixture: youtubeVisitWatchPageChrome20200820", async function() {
    const reportSummarizer = new ReportSummarizer();
    const fixture = youtubeVisitWatchPageChrome20200820;
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
      youtube_navigation_metadata: {
        video_metadata: {
          video_id: "g4mHPeMGTJM",
          video_title: "10 hours of absolute silence (the original)",
          video_description:
            "10 hours of comfortable silence. Only watch the original, everything else may contain sound ;-)",
          video_posting_date: "20 Sep 2011",
          view_count_at_navigation: 4571365,
          view_count_at_navigation_short: "4.5M views",
        },
        page_entry_point: "page_reload",
        url_type: "watch_page",
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
        video_element_play_time: 4000,
        document_visible_time: 4000,
      },
      parent_youtube_navigations_metadata: [],
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
      "should have found youtube navigations",
    );

    // console.dir({ youTubeNavigations }, { depth: 5 });

    assert.deepEqual(youTubeNavigations[0].youtube_visit_metadata, {
      reach_type: "direct_navigation",
      url_type: "watch_page",
      video_element_play_time: 0,
      document_visible_time: 0,
    });
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    assert.deepEqual(youTubeNavigations[1].youtube_visit_metadata, {
      reach_type: "from_watch_page_up_next_column_click",
      url_type: "watch_page",
      video_element_play_time: 0,
      document_visible_time: 0,
    });
    assert.equal(youTubeNavigations[1].parent_youtube_navigations.length, 1);

    const windowAndTabIds1 = firstEncounteredWindowAndTabIds(fixture);
    const youTubeNavigationSpecificRegretReportData1 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
      windowAndTabIds1.windowId,
      windowAndTabIds1.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData1, {
      youtube_navigation_metadata: {
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
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [],
    });

    const windowAndTabIds2 = firstEncounteredWindowAndTabIds(fixture);
    const youTubeNavigationSpecificRegretReportData2 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
      windowAndTabIds2.windowId,
      windowAndTabIds2.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData2, {
      youtube_navigation_metadata: {
        video_metadata: {
          video_description:
            "[http://billwurtz.com](/redirect?v=xuCn8ux2gbs&redir_token=IcgG8GT2OFzaUiUY8ZeAYNEDXOp8MTU4NzEyNTAwNkAxNTg3MDM4NjA2&event=video_description&q=http%3A%2F%2Fbillwurtz.com)\n\n\n\n\npatreon:  [http://patreon.com/billwurtz](/redirect?v=xuCn8ux2gbs&redir_token=IcgG8GT2OFzaUiUY8ZeAYNEDXOp8MTU4NzEyNTAwNkAxNTg3MDM4NjA2&event=video_description&q=http%3A%2F%2Fpatreon.com%2Fbillwurtz)\nspotify:  [https://play.spotify.com/artist/78cT0...](/redirect?v=xuCn8ux2gbs&redir_token=IcgG8GT2OFzaUiUY8ZeAYNEDXOp8MTU4NzEyNTAwNkAxNTg3MDM4NjA2&event=video_description&q=https%3A%2F%2Fplay.spotify.com%2Fartist%2F78cT0dM5Ivm722EP2sgfDh)\nitunes:  [http://itunes.apple.com/us/artist/bil...](/redirect?v=xuCn8ux2gbs&redir_token=IcgG8GT2OFzaUiUY8ZeAYNEDXOp8MTU4NzEyNTAwNkAxNTg3MDM4NjA2&event=video_description&q=http%3A%2F%2Fitunes.apple.com%2Fus%2Fartist%2Fbill-wurtz%2Fid1019208137)\ntwitter:  [http://twitter.com/billwurtz](/redirect?v=xuCn8ux2gbs&redir_token=IcgG8GT2OFzaUiUY8ZeAYNEDXOp8MTU4NzEyNTAwNkAxNTg3MDM4NjA2&event=video_description&q=http%3A%2F%2Ftwitter.com%2Fbillwurtz)\ninstagram:  [http://instagram.com/notbillwurtz](/redirect?v=xuCn8ux2gbs&redir_token=IcgG8GT2OFzaUiUY8ZeAYNEDXOp8MTU4NzEyNTAwNkAxNTg3MDM4NjA2&event=video_description&q=http%3A%2F%2Finstagram.com%2Fnotbillwurtz)\ndonate:  [http://paypal.com/cgi-bin/webscr?cmd=...](/redirect?v=xuCn8ux2gbs&redir_token=IcgG8GT2OFzaUiUY8ZeAYNEDXOp8MTU4NzEyNTAwNkAxNTg3MDM4NjA2&event=video_description&q=http%3A%2F%2Fpaypal.com%2Fcgi-bin%2Fwebscr%3Fcmd%3D_s-xclick%26hosted_button_id%3DVXTWA8CDYP4RJ)\nsoundcloud: [http://soundcloud.com/billwurtz](/redirect?v=xuCn8ux2gbs&redir_token=IcgG8GT2OFzaUiUY8ZeAYNEDXOp8MTU4NzEyNTAwNkAxNTg3MDM4NjA2&event=video_description&q=http%3A%2F%2Fsoundcloud.com%2Fbillwurtz)",
          video_id: "xuCn8ux2gbs",
          video_posting_date: "May 10, 2017",
          video_title: "history of the entire world, i guess",
          view_count_at_navigation: 86023815,
          view_count_at_navigation_short: "86M views",
        },
        page_entry_point: "watch_page",
        url_type: "watch_page",
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 1,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [
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
          via_search_results: 0,
          via_non_search_algorithmic_recommendations_content: 0,
          via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
          video_element_play_time: 0,
          document_visible_time: 0,
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
      "should have found youtube navigations",
    );

    // console.dir({ youTubeNavigations }, { depth: 5 });

    assert.deepEqual(youTubeNavigations[0].youtube_visit_metadata, {
      reach_type: "direct_navigation",
      url_type: "watch_page",
      video_element_play_time: 0,
      document_visible_time: 0,
    });
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    assert.deepEqual(youTubeNavigations[1].youtube_visit_metadata, {
      reach_type: "from_watch_page_watch_next_end_screen_click",
      url_type: "watch_page",
      video_element_play_time: 0,
      document_visible_time: 0,
    });
    assert.equal(youTubeNavigations[1].parent_youtube_navigations.length, 1);

    const windowAndTabIds1 = firstEncounteredWindowAndTabIds(fixture);
    const youTubeNavigationSpecificRegretReportData1 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
      windowAndTabIds1.windowId,
      windowAndTabIds1.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData1, {
      youtube_navigation_metadata: {
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
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [],
    });

    const windowAndTabIds2 = firstEncounteredWindowAndTabIds(fixture);
    const youTubeNavigationSpecificRegretReportData2 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
      windowAndTabIds2.windowId,
      windowAndTabIds2.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData2, {
      youtube_navigation_metadata: {
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
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 1,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [
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
          via_search_results: 0,
          via_non_search_algorithmic_recommendations_content: 0,
          via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
          video_element_play_time: 0,
          document_visible_time: 0,
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
      "should have found youtube navigations",
    );

    // console.dir({ youTubeNavigations }, { depth: 5 });

    assert.deepEqual(youTubeNavigations[0].youtube_visit_metadata, {
      reach_type: "page_reload",
      url_type: "watch_page",
      video_element_play_time: 0,
      document_visible_time: 0,
    });
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    assert.deepEqual(youTubeNavigations[1].youtube_visit_metadata, {
      reach_type: "without_categorized_clicks",
      url_type: "channel_page",
      video_element_play_time: 0,
      document_visible_time: 0,
    });
    assert.equal(youTubeNavigations[1].parent_youtube_navigations.length, 1);

    const youTubeNavigationSpecificRegretReportData1 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData1, {
      youtube_navigation_metadata: {
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
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [],
    });

    const youTubeNavigationSpecificRegretReportData2 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData2, {
      youtube_navigation_metadata: {
        url_type: "channel_page",
        page_entry_point: "watch_page",
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: -1,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: -1,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [
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
          via_search_results: 0,
          via_non_search_algorithmic_recommendations_content: 0,
          via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
          video_element_play_time: 0,
          document_visible_time: 0,
        },
      ],
    });

    const youTubeNavigationSpecificRegretReportData3 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 3),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData3, {
      youtube_navigation_metadata: {
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
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 1,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 1,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [
        {
          page_entry_point: "watch_page",
          url_type: "channel_page",
          via_search_results: 0,
          via_non_search_algorithmic_recommendations_content: -1,
          via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: -1,
          video_element_play_time: 0,
          document_visible_time: 0,
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
          via_search_results: 0,
          via_non_search_algorithmic_recommendations_content: 0,
          via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
          video_element_play_time: 0,
          document_visible_time: 0,
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
      video_element_play_time: 0,
      document_visible_time: 0,
    });
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    assert.deepEqual(youTubeNavigations[1].youtube_visit_metadata, {
      reach_type: "unspecified",
      url_type: "search_results_page",
      video_element_play_time: 0,
      document_visible_time: 0,
    });
    assert.equal(youTubeNavigations[1].parent_youtube_navigations.length, 1);
    assert.deepEqual(youTubeNavigations[2].youtube_visit_metadata, {
      reach_type: "search_results_non_video_click",
      url_type: "user_page",
      video_element_play_time: 0,
      document_visible_time: 0,
    });
    assert.equal(youTubeNavigations[2].parent_youtube_navigations.length, 2);
    assert.deepEqual(youTubeNavigations[3].youtube_visit_metadata, {
      reach_type: "unspecified",
      url_type: "watch_page",
      video_element_play_time: 0,
      document_visible_time: 0,
    });
    assert.equal(youTubeNavigations[3].parent_youtube_navigations.length, 3);

    const youTubeNavigationSpecificRegretReportData1 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData1, {
      youtube_navigation_metadata: {
        page_entry_point: "direct_navigation",
        url_type: "youtube_main_page",
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: -1,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: -1,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [],
    });

    const youTubeNavigationSpecificRegretReportData2 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 2),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData2, {
      youtube_navigation_metadata: {
        page_entry_point: "youtube_main_page",
        url_type: "search_results_page",
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: -1,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: -1,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [
        {
          page_entry_point: "direct_navigation",
          url_type: "youtube_main_page",
          via_search_results: 0,
          via_non_search_algorithmic_recommendations_content: -1,
          via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: -1,
          video_element_play_time: 0,
          document_visible_time: 0,
        },
      ],
    });

    const youTubeNavigationSpecificRegretReportData3 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 3),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData3, {
      youtube_navigation_metadata: {
        page_entry_point: "search_results_page",
        url_type: "user_page",
        via_search_results: 1,
        via_non_search_algorithmic_recommendations_content: -1,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: -1,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [
        {
          page_entry_point: "youtube_main_page",
          url_type: "search_results_page",
          via_search_results: 0,
          via_non_search_algorithmic_recommendations_content: -1,
          via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: -1,
          video_element_play_time: 0,
          document_visible_time: 0,
        },
        {
          page_entry_point: "direct_navigation",
          url_type: "youtube_main_page",
          via_search_results: 0,
          via_non_search_algorithmic_recommendations_content: -1,
          via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: -1,
          video_element_play_time: 0,
          document_visible_time: 0,
        },
      ],
    });

    const youTubeNavigationSpecificRegretReportData4 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 4),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData4, {
      youtube_navigation_metadata: {
        video_metadata: {
          video_description:
            "Cal Jam 18 took place October 6, 2018 in San Bernardino, CA. \nSIGN UP FOR MORE INFO ON FUTURE EVENTS: [https://www.caljamfest.com/](/redirect?redir_token=e24CaXAPlv5dOa6xNFHQqQnjvUJ8MTU4NzgxOTYyNkAxNTg3NzMzMjI2&q=https%3A%2F%2Fwww.caljamfest.com%2F&event=video_description&v=PdDpbKX-N-4)",
          video_id: "PdDpbKX-N-4",
          video_posting_date: "Feb 28, 2020",
          video_title: "Cal Jam 18 - More Good Times!",
          view_count_at_navigation: 31958,
          view_count_at_navigation_short: "31K views",
        },
        page_entry_point: "user_page",
        url_type: "watch_page",
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 1,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 1,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [
        {
          page_entry_point: "search_results_page",
          url_type: "user_page",
          via_search_results: 1,
          via_non_search_algorithmic_recommendations_content: -1,
          via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: -1,
          video_element_play_time: 0,
          document_visible_time: 0,
        },
        {
          page_entry_point: "youtube_main_page",
          url_type: "search_results_page",
          via_search_results: 0,
          via_non_search_algorithmic_recommendations_content: -1,
          via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: -1,
          video_element_play_time: 0,
          document_visible_time: 0,
        },
        {
          page_entry_point: "direct_navigation",
          url_type: "youtube_main_page",
          via_search_results: 0,
          via_non_search_algorithmic_recommendations_content: -1,
          via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: -1,
          video_element_play_time: 0,
          document_visible_time: 0,
        },
      ],
    });
  });

  it("fixture: youtubeVisitWatchPageAndSearchClickUserSearchResultVideo", async function() {
    const reportSummarizer = new ReportSummarizer();
    const fixture = youtubeVisitWatchPageAndSearchClickUserSearchResultVideo;
    const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      fixture,
    );
    const windowAndTabIds = firstEncounteredWindowAndTabIds(fixture);

    assert.equal(
      youTubeNavigations.length,
      3,
      "should have found youtube navigations",
    );

    // console.dir({ youTubeNavigations }, { depth: 5 });

    assert.deepEqual(youTubeNavigations[0].youtube_visit_metadata, {
      reach_type: "page_reload",
      url_type: "watch_page",
      video_element_play_time: 0,
      document_visible_time: 0,
    });
    assert.equal(youTubeNavigations[0].parent_youtube_navigations.length, 0);
    assert.deepEqual(youTubeNavigations[1].youtube_visit_metadata, {
      reach_type: "without_categorized_clicks", // search action
      url_type: "search_results_page",
      video_element_play_time: 0,
      document_visible_time: 0,
    });
    assert.equal(youTubeNavigations[1].parent_youtube_navigations.length, 1);
    assert.deepEqual(youTubeNavigations[2].youtube_visit_metadata, {
      reach_type: "search_results_page_other_indirect_videos_click",
      url_type: "watch_page",
      video_element_play_time: 0,
      document_visible_time: 0,
    });
    assert.equal(youTubeNavigations[2].parent_youtube_navigations.length, 2);

    const youTubeNavigationSpecificRegretReportData1 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 1),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData1, {
      youtube_navigation_metadata: {
        video_metadata: {
          video_description:
            "10 hours of comfortable silence. Only watch the original, everything else may contain sound ;-)",
          video_id: "g4mHPeMGTJM",
          video_posting_date: "Sep 20, 2011",
          video_title: "10 hours of absolute silence (the original)",
          view_count_at_navigation: 4217099,
          view_count_at_navigation_short: "4.2M views",
        },
        page_entry_point: "page_reload",
        url_type: "watch_page",
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [],
    });

    const youTubeNavigationSpecificRegretReportData2 = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
      youTubeNavigations.slice(0, 3),
      windowAndTabIds.windowId,
      windowAndTabIds.tabId,
    );
    assert.deepEqual(youTubeNavigationSpecificRegretReportData2, {
      youtube_navigation_metadata: {
        video_metadata: {
          video_description:
            "Check out Foo Fighter’s full Hyde Park concert in London, June 17th 2006.\nKeep washing your hands. [#Stayhome](/results?search_query=%23Stayhome)\n \nListen to Foo Fighters: [https://FooFighters.lnk.to/listen_YD](/redirect?q=https%3A%2F%2FFooFighters.lnk.to%2Flisten_YD&redir_token=NWmHK6Cec4zk7MPOzibWBOMcqip8MTU4ODI0MTM1NkAxNTg4MTU0OTU2&v=A8z6rbmx7Mg&event=video_description)\nSubscribe to the official Foo Fighters YouTube channel: [https://FooFighters.lnk.to/subscribeYD](/redirect?q=https%3A%2F%2FFooFighters.lnk.to%2FsubscribeYD&redir_token=NWmHK6Cec4zk7MPOzibWBOMcqip8MTU4ODI0MTM1NkAxNTg4MTU0OTU2&v=A8z6rbmx7Mg&event=video_description)\nWatch more Foo Fighter videos: [https://FooFighters.lnk.to/listen_YC/...](/redirect?q=https%3A%2F%2FFooFighters.lnk.to%2Flisten_YC%2Fyoutube&redir_token=NWmHK6Cec4zk7MPOzibWBOMcqip8MTU4ODI0MTM1NkAxNTg4MTU0OTU2&v=A8z6rbmx7Mg&event=video_description)\n \nFollow Foo Fighters:\nFacebook: [https://FooFighters.lnk.to/followFI](/redirect?q=https%3A%2F%2FFooFighters.lnk.to%2FfollowFI&redir_token=NWmHK6Cec4zk7MPOzibWBOMcqip8MTU4ODI0MTM1NkAxNTg4MTU0OTU2&v=A8z6rbmx7Mg&event=video_description)\nInstagram: [https://FooFighters.lnk.to/followII](/redirect?q=https%3A%2F%2FFooFighters.lnk.to%2FfollowII&redir_token=NWmHK6Cec4zk7MPOzibWBOMcqip8MTU4ODI0MTM1NkAxNTg4MTU0OTU2&v=A8z6rbmx7Mg&event=video_description)\nTwitter: [https://FooFighters.lnk.to/followTI](/redirect?q=https%3A%2F%2FFooFighters.lnk.to%2FfollowTI&redir_token=NWmHK6Cec4zk7MPOzibWBOMcqip8MTU4ODI0MTM1NkAxNTg4MTU0OTU2&v=A8z6rbmx7Mg&event=video_description)\nWebsite: [https://FooFighters.lnk.to/followWI](/redirect?q=https%3A%2F%2FFooFighters.lnk.to%2FfollowWI&redir_token=NWmHK6Cec4zk7MPOzibWBOMcqip8MTU4ODI0MTM1NkAxNTg4MTU0OTU2&v=A8z6rbmx7Mg&event=video_description)\nSpotify: [https://FooFighters.lnk.to/followSI](/redirect?q=https%3A%2F%2FFooFighters.lnk.to%2FfollowSI&redir_token=NWmHK6Cec4zk7MPOzibWBOMcqip8MTU4ODI0MTM1NkAxNTg4MTU0OTU2&v=A8z6rbmx7Mg&event=video_description)\nYouTube: [https://FooFighters.lnk.to/subscribeYD](/redirect?q=https%3A%2F%2FFooFighters.lnk.to%2FsubscribeYD&redir_token=NWmHK6Cec4zk7MPOzibWBOMcqip8MTU4ODI0MTM1NkAxNTg4MTU0OTU2&v=A8z6rbmx7Mg&event=video_description)\n[#FooFighters](/results?search_query=%23FooFighters) [#HydePark](/results?search_query=%23HydePark) [#StayHome](/results?search_query=%23StayHome)",
          video_id: "A8z6rbmx7Mg",
          video_posting_date: "Premiered Apr 24, 2020",
          video_title: "Foo Fighters - Live in Hyde Park (2006)",
          view_count_at_navigation: 316817,
          view_count_at_navigation_short: "316K views",
        },
        page_entry_point: "search_results_page",
        url_type: "watch_page",
        via_search_results: 1,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 1,
        video_element_play_time: 0,
        document_visible_time: 0,
      },
      parent_youtube_navigations_metadata: [
        {
          page_entry_point: "watch_page",
          url_type: "search_results_page",
          via_non_search_algorithmic_recommendations_content: -1,
          via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: -1,
          via_search_results: 0,
          video_element_play_time: 0,
          document_visible_time: 0,
        },
        {
          video_metadata: {
            video_description:
              "10 hours of comfortable silence. Only watch the original, everything else may contain sound ;-)",
            video_id: "g4mHPeMGTJM",
            video_posting_date: "Sep 20, 2011",
            video_title: "10 hours of absolute silence (the original)",
            view_count_at_navigation: 4217099,
            view_count_at_navigation_short: "4.2M views",
          },
          page_entry_point: "page_reload",
          url_type: "watch_page",
          via_search_results: 0,
          via_non_search_algorithmic_recommendations_content: 0,
          via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
          video_element_play_time: 0,
          document_visible_time: 0,
        },
      ],
    });
  });

  it("fixture: youtubeVisitWatchPageChangeTabSwitchBackAndPlayVideoForAWhile", async function() {
    const reportSummarizer = new ReportSummarizer();
    const fixture = youtubeVisitWatchPageChangeTabSwitchBackAndPlayVideoForAWhile;
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
      youtube_navigation_metadata: {
        video_metadata: {
          video_id: "g4mHPeMGTJM",
          video_title: "10 hours of absolute silence (the original)",
          video_description:
            "10 hours of comfortable silence. Only watch the original, everything else may contain sound ;-)",
          video_posting_date: "Sep 20, 2011",
          view_count_at_navigation: 4326854,
          view_count_at_navigation_short: "4.3M views",
        },
        page_entry_point: "page_reload",
        url_type: "watch_page",
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
        video_element_play_time: 8000,
        document_visible_time: 15000,
      },
      parent_youtube_navigations_metadata: [],
    });
  });
});

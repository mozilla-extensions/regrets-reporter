import { assert } from "chai";
import {
  YouTubeUsageStatistics,
  YouTubeUsageStatisticsUpdate,
} from "./YouTubeUsageStatistics";
import { youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo";
import { youtubeVisitWatchPageAndNavigateToFirstUpNext } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndNavigateToFirstUpNext";
import { youtubeVisitWatchPageChangeTabSwitchBackAndPlayVideoForAWhile } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageChangeTabSwitchBackAndPlayVideoForAWhile";
import { NavigationBatch } from "./NavigationBatchPreprocessor";
import { mockLocalStorage } from "./lib/mockLocalStorage";
import { ReportSummarizer } from "./ReportSummarizer";
import { Store } from "./Store";
const reportSummarizer = new ReportSummarizer();

const summarizeUpdate = async (
  navigationBatchesByUuid: {
    [navigationUuid: string]: NavigationBatch;
  },
  youTubeUsageStatistics: YouTubeUsageStatistics,
): Promise<YouTubeUsageStatisticsUpdate> => {
  const navUuids = Object.keys(navigationBatchesByUuid);
  for (const navUuid of navUuids) {
    await youTubeUsageStatistics.seenNavigationBatch(
      navigationBatchesByUuid[navUuid],
    );
    // "See" it twice so that we know that it does not affect the statistics
    await youTubeUsageStatistics.seenNavigationBatch(
      navigationBatchesByUuid[navUuid],
    );
  }
  return await youTubeUsageStatistics.summarizeUpdate();
};

describe("YouTubeUsageStatistics", function() {
  it("should exist", async function() {
    mockLocalStorage.reset();
    const store = new Store(mockLocalStorage);
    const youTubeUsageStatistics = new YouTubeUsageStatistics(
      store,
      reportSummarizer,
    );
    await youTubeUsageStatistics.hydrate();
    assert.isObject(youTubeUsageStatistics);
  });

  it("before any usage", async function() {
    mockLocalStorage.reset();
    const store = new Store(mockLocalStorage);
    const youTubeUsageStatistics = new YouTubeUsageStatistics(
      store,
      reportSummarizer,
    );
    await youTubeUsageStatistics.hydrate();
    const summarizedUpdate = await summarizeUpdate({}, youTubeUsageStatistics);

    assert.deepEqual(summarizedUpdate, {
      amount_of_days_with_at_least_one_youtube_visit: 0,
      amount_of_time_with_an_active_youtube_tab: 0,
      amount_of_youtube_watch_pages_loaded: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_days_with_at_least_one_youtube_watch_page_load: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_time_with_an_active_youtube_watch_page_tab: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_days_of_at_least_one_video_played_on_a_youtube_watch_page: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_youtube_videos_played_on_youtube_watch_pages: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_youtube_video_play_time: 0,
      amount_of_youtube_video_play_time_on_youtube_watch_pages: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
    });
  });

  it("fixture: youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo", async function() {
    mockLocalStorage.reset();
    const store = new Store(mockLocalStorage);
    const youTubeUsageStatistics = new YouTubeUsageStatistics(
      store,
      reportSummarizer,
    );
    await youTubeUsageStatistics.hydrate();
    const summarizedUpdate = await summarizeUpdate(
      youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo,
      youTubeUsageStatistics,
    );

    assert.deepEqual(summarizedUpdate, {
      amount_of_days_with_at_least_one_youtube_visit: 1,
      amount_of_time_with_an_active_youtube_tab: 0,
      amount_of_youtube_watch_pages_loaded: {
        in_total: 1,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_days_with_at_least_one_youtube_watch_page_load: {
        in_total: 1,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_time_with_an_active_youtube_watch_page_tab: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_days_of_at_least_one_video_played_on_a_youtube_watch_page: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_youtube_videos_played_on_youtube_watch_pages: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_youtube_video_play_time: 0,
      amount_of_youtube_video_play_time_on_youtube_watch_pages: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
    });

    const youTubeUsageStatistics2 = new YouTubeUsageStatistics(
      store,
      reportSummarizer,
    );
    await youTubeUsageStatistics2.hydrate();

    // Before persist
    const summarizedUpdate2 = await youTubeUsageStatistics2.summarizeUpdate();

    assert.deepEqual(summarizedUpdate2, {
      amount_of_days_with_at_least_one_youtube_visit: 0,
      amount_of_time_with_an_active_youtube_tab: 0,
      amount_of_youtube_watch_pages_loaded: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_days_with_at_least_one_youtube_watch_page_load: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_time_with_an_active_youtube_watch_page_tab: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_days_of_at_least_one_video_played_on_a_youtube_watch_page: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_youtube_videos_played_on_youtube_watch_pages: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_youtube_video_play_time: 0,
      amount_of_youtube_video_play_time_on_youtube_watch_pages: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
    });

    // After persist + re-hydration
    await youTubeUsageStatistics.persist();
    await youTubeUsageStatistics2.hydrate();
    const summarizedUpdate3 = await youTubeUsageStatistics2.summarizeUpdate();

    assert.deepEqual(summarizedUpdate3, {
      amount_of_days_with_at_least_one_youtube_visit: 1,
      amount_of_time_with_an_active_youtube_tab: 0,
      amount_of_youtube_watch_pages_loaded: {
        in_total: 1,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_days_with_at_least_one_youtube_watch_page_load: {
        in_total: 1,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_time_with_an_active_youtube_watch_page_tab: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_days_of_at_least_one_video_played_on_a_youtube_watch_page: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_youtube_videos_played_on_youtube_watch_pages: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_youtube_video_play_time: 0,
      amount_of_youtube_video_play_time_on_youtube_watch_pages: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
    });
  });

  it("fixture: youtubeVisitWatchPageAndNavigateToFirstUpNext", async function() {
    mockLocalStorage.reset();
    const store = new Store(mockLocalStorage);
    const youTubeUsageStatistics = new YouTubeUsageStatistics(
      store,
      reportSummarizer,
    );
    await youTubeUsageStatistics.hydrate();
    const summarizedUpdate = await summarizeUpdate(
      youtubeVisitWatchPageAndNavigateToFirstUpNext,
      youTubeUsageStatistics,
    );

    assert.deepEqual(summarizedUpdate, {
      amount_of_days_with_at_least_one_youtube_visit: 1,
      amount_of_time_with_an_active_youtube_tab: 0,
      amount_of_youtube_watch_pages_loaded: {
        in_total: 2,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 1,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_days_with_at_least_one_youtube_watch_page_load: {
        in_total: 1,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 1,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_time_with_an_active_youtube_watch_page_tab: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_days_of_at_least_one_video_played_on_a_youtube_watch_page: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_youtube_videos_played_on_youtube_watch_pages: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_youtube_video_play_time: 0,
      amount_of_youtube_video_play_time_on_youtube_watch_pages: {
        in_total: 0,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
    });
  });

  it("fixture: youtubeVisitWatchPageChangeTabSwitchBackAndPlayVideoForAWhile", async function() {
    mockLocalStorage.reset();
    const store = new Store(mockLocalStorage);
    const youTubeUsageStatistics = new YouTubeUsageStatistics(
      store,
      reportSummarizer,
    );
    await youTubeUsageStatistics.hydrate();
    const summarizedUpdate = await summarizeUpdate(
      youtubeVisitWatchPageChangeTabSwitchBackAndPlayVideoForAWhile,
      youTubeUsageStatistics,
    );

    assert.deepEqual(summarizedUpdate, {
      amount_of_days_with_at_least_one_youtube_visit: 1,
      amount_of_time_with_an_active_youtube_tab: 15000,
      amount_of_youtube_watch_pages_loaded: {
        in_total: 1,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_days_with_at_least_one_youtube_watch_page_load: {
        in_total: 1,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_time_with_an_active_youtube_watch_page_tab: {
        in_total: 15000,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_days_of_at_least_one_video_played_on_a_youtube_watch_page: {
        in_total: 1,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_youtube_videos_played_on_youtube_watch_pages: {
        in_total: 1,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
      amount_of_youtube_video_play_time: 8000,
      amount_of_youtube_video_play_time_on_youtube_watch_pages: {
        in_total: 8000,
        via_search_results: 0,
        via_non_search_algorithmic_recommendations_content: 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
      },
    });
  });
});

import { assert } from "chai";
import {
  YouTubeUsageStatistics,
  YouTubeUsageStatisticsUpdate,
} from "./YouTubeUsageStatistics";
import { youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo";
import { youtubeVisitWatchPageAndNavigateToFirstUpNext } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndNavigateToFirstUpNext";
import { NavigationBatch } from "./NavigationBatchPreprocessor";
import { mockLocalStorage } from "./lib/mockLocalStorage";
import { ReportSummarizer } from "./ReportSummarizer";
import { ActiveTabDwellTimeMonitor } from "./ActiveTabDwellTimeMonitor";
import { Store } from "./Store";
import { Tabs } from "webextension-polyfill-ts";
import Tab = Tabs.Tab;
const reportSummarizer = new ReportSummarizer();
const activeTabDwellTimeMonitor = new ActiveTabDwellTimeMonitor();
const store = new Store(mockLocalStorage);

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
  }
  const mockTab = { url: "https://www.youtube.com/watch?v=g4mHPeMGTJM" } as Tab;
  await youTubeUsageStatistics.seenTabActiveDwellTimeIncrement(mockTab, 1500);
  return await youTubeUsageStatistics.summarizeUpdate();
};

describe("YouTubeUsageStatistics", function() {
  it("should exist", async function() {
    const youTubeUsageStatistics = new YouTubeUsageStatistics(
      store,
      reportSummarizer,
      activeTabDwellTimeMonitor,
    );
    assert.isObject(youTubeUsageStatistics);
  });

  it("before any usage", async function() {
    const youTubeUsageStatistics = new YouTubeUsageStatistics(
      store,
      reportSummarizer,
      activeTabDwellTimeMonitor,
    );
    const summarizedUpdate = await summarizeUpdate({}, youTubeUsageStatistics);

    assert.deepEqual(summarizedUpdate, {
      amount_of_days_of_at_least_one_youtube_visit: 0,
      amount_of_youtube_watch_pages_loaded: 0,
      amount_of_time_with_an_active_youtube_tab: 1500,
      /*
      amount_of_youtube_videos_played_on_youtube_watch_pages: 0,
      amount_of_youtube_video_play_time_in_seconds: 0,
       */
    });
  });

  it("fixture: youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo", async function() {
    const youTubeUsageStatistics = new YouTubeUsageStatistics(
      store,
      reportSummarizer,
      activeTabDwellTimeMonitor,
    );
    const summarizedUpdate = await summarizeUpdate(
      youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo,
      youTubeUsageStatistics,
    );

    assert.deepEqual(summarizedUpdate, {
      amount_of_days_of_at_least_one_youtube_visit: 1,
      amount_of_youtube_watch_pages_loaded: 1,
      amount_of_time_with_an_active_youtube_tab: 1500,
      /*
      amount_of_youtube_videos_played_on_youtube_watch_pages: -1,
      amount_of_youtube_video_play_time_in_seconds: -1,
       */
    });
  });

  it("fixture: youtubeVisitWatchPageAndNavigateToFirstUpNext", async function() {
    const youTubeUsageStatistics = new YouTubeUsageStatistics(
      store,
      reportSummarizer,
      activeTabDwellTimeMonitor,
    );
    const summarizedUpdate = await summarizeUpdate(
      youtubeVisitWatchPageAndNavigateToFirstUpNext,
      youTubeUsageStatistics,
    );

    assert.deepEqual(summarizedUpdate, {
      amount_of_days_of_at_least_one_youtube_visit: 1,
      amount_of_youtube_watch_pages_loaded: 2,
      amount_of_time_with_an_active_youtube_tab: 1500,
      /*
      amount_of_youtube_videos_played_on_youtube_watch_pages: -1,
      amount_of_youtube_video_play_time_in_seconds: -1,
       */
    });
  });
});

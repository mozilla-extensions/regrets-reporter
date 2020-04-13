import { assert } from "chai";
import {
  YouTubeUsageStatistics,
  YouTubeUsageStatisticsUpdate,
} from "./YouTubeUsageStatistics";
import { youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo";
import { youtubeVisitWatchPageAndNavigateToFirstUpNext } from "./fixtures/ReportSummarizer/youtubeVisitWatchPageAndNavigateToFirstUpNext";
import { NavigationBatch } from "./NavigationBatchPreprocessor";

const extension_installation_uuid = "placeholder_extensionInstallationUuid";
const fakeUUID = () => "52cba568-949c-4d5b-88c8-4fbb674452fc";

const summarizeUpdate = (
  navigationBatchesByUuid: {
    [navigationUuid: string]: NavigationBatch;
  },
  youTubeUsageStatistics: YouTubeUsageStatistics,
): YouTubeUsageStatisticsUpdate => {
  const navUuids = Object.keys(navigationBatchesByUuid);
  for (const navUuid of navUuids) {
    youTubeUsageStatistics.seenNavigationBatch(
      navigationBatchesByUuid[navUuid],
    );
  }
  return youTubeUsageStatistics.summarizeUpdate(
    extension_installation_uuid,
    fakeUUID,
  );
};

describe("YouTubeUsageStatistics", function() {
  it("should exist", async function() {
    const youTubeUsageStatistics = new YouTubeUsageStatistics();
    assert.isObject(youTubeUsageStatistics);
  });

  it("fixture: youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo", async function() {
    const youTubeUsageStatistics = new YouTubeUsageStatistics();
    const summarizedUpdate = summarizeUpdate(
      youtubeVisitWatchPageAndStartPlaying10hOfSilenceVideo,
      youTubeUsageStatistics,
    );

    assert.deepEqual(summarizedUpdate, {
      amount_of_days_of_at_least_one_youtube_visit: -1,
      amount_of_youtube_youtube_watch_pages_loaded: -1,
      amount_of_youtube_videos_played_on_youtube_watch_pages: -1,
      amount_of_time_with_an_active_youtube_tab: -1,
      amount_of_youtube_video_play_time_in_seconds: -1,
      event_metadata: {
        client_timestamp: new Date().toISOString(),
        extension_installation_uuid,
        event_uuid: fakeUUID(),
      },
    });
  });

  it("fixture: youtubeVisitWatchPageAndNavigateToFirstUpNext", async function() {
    const youTubeUsageStatistics = new YouTubeUsageStatistics();
    const summarizedUpdate = summarizeUpdate(
      youtubeVisitWatchPageAndNavigateToFirstUpNext,
      youTubeUsageStatistics,
    );

    assert.deepEqual(summarizedUpdate, {
      amount_of_days_of_at_least_one_youtube_visit: -1,
      amount_of_youtube_youtube_watch_pages_loaded: -1,
      amount_of_youtube_videos_played_on_youtube_watch_pages: -1,
      amount_of_time_with_an_active_youtube_tab: -1,
      amount_of_youtube_video_play_time_in_seconds: -1,
      event_metadata: {
        client_timestamp: new Date().toISOString(),
        extension_installation_uuid,
        event_uuid: fakeUUID(),
      },
    });
  });
});

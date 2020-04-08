import { NavigationBatch } from "./NavigationBatchPreprocessor";

interface YouTubeUsageStatisticsUpdate {
  amount_of_days_of_at_least_one_youtube_visit: number;
  amount_of_youtube_youtube_watch_pages_loaded: number;
  amount_of_youtube_videos_played_on_youtube_watch_pages: number;
  amount_of_time_with_an_active_youtube_tab: number;
  amount_of_youtube_video_play_time_in_seconds: number;
}

interface YouTubeUsageStatisticsRegistry {
  dates_with_at_least_one_youtube_visit_by_date: string[];
  amount_of_youtube_youtube_watch_pages_loaded_by_date: {
    [date: string]: number;
  };
  amount_of_youtube_videos_played_on_youtube_watch_pages_by_date: {
    [date: string]: number;
  };
  amount_of_time_with_an_active_youtube_tab_by_date: { [date: string]: number };
  amount_of_youtube_video_play_time_in_seconds_by_date: {
    [date: string]: number;
  };
}

export class YouTubeUsageStatisticsMonitor {
  public registry: YouTubeUsageStatisticsRegistry;

  seenNavigationBatch = (navigationBatch: NavigationBatch): void => {
    // TODO
  };

  summarizeUpdate = (): YouTubeUsageStatisticsUpdate => {
    return null;
  };
}

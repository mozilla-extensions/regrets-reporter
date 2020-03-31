import { NavigationBatch } from "./NavigationBatchPreprocessor";

type YouTubeNavigationLinkCategory = "foo" | "bar";

interface YouTubeNavigation {
  video_id: string;
  view_count_at_navigation: number;
  tab_active_dwell_time_at_navigation: number;
  referrer: string;
  outgoing_links_by_category: {
    [category in YouTubeNavigationLinkCategory]: string[];
  };
  parent_youtube_navigations: YouTubeNavigation[];
  how_the_video_page_likely_was_reached: YouTubeNavigationLinkCategory;
  window_id: number;
  tab_id: number;
  frame_id: number;
  client_timestamp: string;
  installation_uuid: string;
  event_uuid: string;
}

export class ReportSummarizer {
  async navigationBatchesByUuidToYouTubeNavigations(navigationBatchesByUuid: {
    [navigationUuid: string]: NavigationBatch;
  }): Promise<YouTubeNavigation[]> {
    // TODO
    return [];
  }
}

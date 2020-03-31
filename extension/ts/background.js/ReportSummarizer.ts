import { NavigationBatch } from "./NavigationBatchPreprocessor";

type YouTubeNavigationLinkCategory = "foo" | "bar";

interface YouTubeNavigation {
  video_id: string;
  video_title: string;
  video_thumbnail_url: string;
  video_posting_date: string;
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
    // Only consider navigations in the top/main frame (no subframes)
    const topFrameNavUuids = Object.keys(navigationBatchesByUuid).filter(
      navUuid =>
        navigationBatchesByUuid[navUuid].navigationEnvelope.navigation
          .frame_id === 0,
    );
    console.log({ topFrameNavUuids });
    return topFrameNavUuids.map(topFrameNavUuid => {
      const topFrameNavigationBatch = navigationBatchesByUuid[topFrameNavUuid];

      // Order child envelopes by event ordinals = the order they were emitted
      // TODO

      // Find the main_frame http_response (first http response of the navigation batch)
      // TODO: Handle subsequent pushState-based navigations
      const httpResponseEnvelope = topFrameNavigationBatch.childEnvelopes.find(
        childEnvelope =>
          childEnvelope.type === "http_responses" &&
          childEnvelope.httpResponse.frame_id === 0,
      );

      // ... and the corresponding captured content
      const capturedContentEnvelope = topFrameNavigationBatch.childEnvelopes.find(
        childEnvelope =>
          childEnvelope.type === "openwpm_captured_content" &&
          childEnvelope.capturedContent.frame_id === 0 &&
          childEnvelope.capturedContent.content_hash ===
            httpResponseEnvelope.httpResponse.content_hash,
      );

      // Extract video metadata from the captured content
      const htmlContent =
        capturedContentEnvelope.capturedContent.decoded_content;
      const matchArray = htmlContent.match(
        /window\["ytInitialData"\]\s*=\s*(.*);\s*window\["ytInitialPlayerResponse"\]/,
      );
      const ytInitialData = JSON.parse(matchArray[1]);
      console.log({ ytInitialData });

      const youTubeNavigation: YouTubeNavigation = {
        video_id: "foo",
        video_title: "foo",
        video_thumbnail_url: "foo",
        video_posting_date: "foo",
        view_count_at_navigation: -1,
        tab_active_dwell_time_at_navigation: -1,
        referrer: "foo",
        outgoing_links_by_category: { foo: [], bar: [] },
        parent_youtube_navigations: [],
        how_the_video_page_likely_was_reached: "foo",
        window_id: -1,
        tab_id: -1,
        frame_id: -1,
        client_timestamp: "foo",
        installation_uuid: "foo",
        event_uuid: "foo",
      };
      return youTubeNavigation;
    });
  }
}

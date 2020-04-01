import { NavigationBatch } from "./NavigationBatchPreprocessor";

type YouTubeNavigationLinkCategory =
  | "up_next_auto_play"
  | "watch_next_column"
  | "watch_next_end_screen";

type FailedStringAttribute = "<failed>";
type FailedIntegerAttribute = -1;

interface YouTubeNavigation {
  video_id: string | FailedStringAttribute;
  video_title: string | FailedStringAttribute;
  video_description: string | FailedStringAttribute;
  video_posting_date: string | FailedStringAttribute;
  view_count_at_navigation: number | FailedIntegerAttribute;
  view_count_at_navigation_short: string | FailedStringAttribute;
  tab_active_dwell_time_at_navigation: number | FailedIntegerAttribute;
  referrer: undefined | string | FailedStringAttribute;
  navigation_transition_type: string;
  outgoing_video_ids_by_category: {
    [category in YouTubeNavigationLinkCategory]:
      | string[]
      | FailedStringAttribute;
  };
  parent_youtube_navigations: YouTubeNavigation[];
  how_the_video_page_likely_was_reached: YouTubeNavigationLinkCategory | "foo";
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
      // console.log({ ytInitialData });

      let video_id;
      try {
        video_id = ytInitialData.currentVideoEndpoint.watchEndpoint.videoId;
      } catch (err) {
        video_id = "<failed>";
      }

      let video_title;
      try {
        video_title =
          ytInitialData.contents.twoColumnWatchNextResults.results.results
            .contents[0].videoPrimaryInfoRenderer.title.runs[0].text;
      } catch (err) {
        video_title = "<failed>";
      }

      let video_description;
      try {
        video_description =
          ytInitialData.contents.twoColumnWatchNextResults.results.results
            .contents[1].videoSecondaryInfoRenderer.description.runs[0].text;
      } catch (err) {
        video_description = "<failed>";
      }

      let video_posting_date;
      try {
        video_posting_date =
          ytInitialData.contents.twoColumnWatchNextResults.results.results
            .contents[0].videoPrimaryInfoRenderer.viewCount
            .videoViewCountRenderer.shortViewCount.simpleText;
      } catch (err) {
        video_posting_date = "";
      }

      let view_count_at_navigation;
      try {
        view_count_at_navigation = ytInitialData.contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer.viewCount.simpleText.replace(
          /\D/g,
          "",
        );
      } catch (err) {
        view_count_at_navigation = -1;
      }

      let view_count_at_navigation_short;
      try {
        view_count_at_navigation_short =
          ytInitialData.contents.twoColumnWatchNextResults.results.results
            .contents[0].videoPrimaryInfoRenderer.dateText.simpleText;
      } catch (err) {
        view_count_at_navigation_short = "<failed>";
      }

      let up_next_auto_play;
      try {
        up_next_auto_play = ytInitialData.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results[0].compactAutoplayRenderer.contents.map(
          el => el.compactVideoRenderer.videoId,
        );
      } catch (err) {
        up_next_auto_play = "<failed>";
      }

      let watch_next_column;
      try {
        watch_next_column = ytInitialData.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results
          .slice(1)
          .map(el => el.compactVideoRenderer.videoId);
      } catch (err) {
        watch_next_column = "<failed>";
      }

      let watch_next_end_screen;
      try {
        watch_next_end_screen = ytInitialData.playerOverlays.playerOverlayRenderer.endScreen.watchNextEndScreenRenderer.results.map(
          el => el.endScreenVideoRenderer.videoId,
        );
      } catch (err) {
        watch_next_end_screen = "<failed>";
      }

      const youTubeNavigation: YouTubeNavigation = {
        video_id,
        video_title,
        video_description,
        video_posting_date,
        view_count_at_navigation,
        view_count_at_navigation_short,
        tab_active_dwell_time_at_navigation:
          topFrameNavigationBatch.navigationEnvelope.tabActiveDwellTime,
        referrer: document ? document.referrer : "<failed>",
        navigation_transition_type:
          topFrameNavigationBatch.navigationEnvelope.navigation.transition_type,
        outgoing_video_ids_by_category: {
          up_next_auto_play,
          watch_next_column,
          watch_next_end_screen,
        },
        parent_youtube_navigations: [],
        how_the_video_page_likely_was_reached: "foo",
        window_id:
          topFrameNavigationBatch.navigationEnvelope.navigation.window_id,
        tab_id: topFrameNavigationBatch.navigationEnvelope.navigation.tab_id,
        frame_id:
          topFrameNavigationBatch.navigationEnvelope.navigation.frame_id,
        client_timestamp:
          topFrameNavigationBatch.navigationEnvelope.navigation
            .committed_time_stamp,
        installation_uuid: "foo",
        event_uuid: topFrameNavigationBatch.navigationEnvelope.navigation.uuid,
      };
      return youTubeNavigation;
    });
  }
}

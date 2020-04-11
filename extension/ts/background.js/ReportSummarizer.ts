import {
  NavigationBatch,
  TrimmedNavigationBatch,
} from "./NavigationBatchPreprocessor";

type YouTubeNavigationLinkCategory =
  | "up_next_auto_play"
  | "watch_next_column"
  | "watch_next_end_screen";

type FailedStringAttribute = "<failed>";
type FailedIntegerAttribute = -1;

export interface VideoMetadata {
  video_id: string | FailedStringAttribute;
  video_title: string | FailedStringAttribute;
  video_description: string | FailedStringAttribute;
  video_posting_date: string | FailedStringAttribute;
  view_count_at_navigation: number | FailedIntegerAttribute;
  view_count_at_navigation_short: string | FailedStringAttribute;
  outgoing_video_ids_by_category: {
    [category in YouTubeNavigationLinkCategory]:
      | string[]
      | FailedStringAttribute;
  };
}

export interface YouTubeNavigation {
  video_metadata: undefined | VideoMetadata;
  tab_active_dwell_time_at_navigation: number | FailedIntegerAttribute;
  referrer: undefined | string | FailedStringAttribute;
  navigation_transition_type: string;
  parent_youtube_navigations: YouTubeNavigation[];
  how_the_video_page_likely_was_reached: YouTubeNavigationLinkCategory | "foo";
  window_id: number;
  tab_id: number;
  frame_id: number;
  client_timestamp: string;
  extension_installation_uuid: string;
  event_uuid: string;
}

export class ReportSummarizer {
  trimNavigationBatch(
    navigationBatch: NavigationBatch,
  ): TrimmedNavigationBatch {
    const trimmedNavigationBatch = {
      ...navigationBatch,
      trimmedHttpRequestCount: -1,
      trimmedHttpResponseCount: -1,
      trimmedHttpRedirectCount: -1,
      trimmedJavascriptOperationCount: -1,
      trimmedCapturedContentCount: -1,
    };
    // console.log({ trimmedNavigationBatch });

    // Remove bulky non-essential parts of navigation batches
    // TODO

    return trimmedNavigationBatch;
  }

  async navigationBatchesByUuidToYouTubeNavigations(
    navigationBatchesByUuid: {
      [navigationUuid: string]: TrimmedNavigationBatch;
    },
    extension_installation_uuid: string,
  ): Promise<YouTubeNavigation[]> {
    // Only consider navigations in the top/main frame (no subframes)
    // (this should already be taken care of by the filtering in OpenWpmPacketHandler
    // but keeping for clarity's sake)
    const topFrameNavUuids = Object.keys(navigationBatchesByUuid).filter(
      navUuid =>
        navigationBatchesByUuid[navUuid].navigationEnvelope.navigation
          .frame_id === 0,
    );
    console.log("topFrameNavUuids.length", topFrameNavUuids.length);
    const youTubeNavigations: YouTubeNavigation[] = [];

    for (const topFrameNavUuid of topFrameNavUuids) {
      const topFrameNavigationBatch = navigationBatchesByUuid[topFrameNavUuid];

      // Order child envelopes by event ordinals = the order they were emitted
      // TODO

      // Check what kind of page was visited and run the appropriate extraction methods
      if (
        topFrameNavigationBatch.navigationEnvelope.navigation.url.indexOf(
          "https://www.youtube.com/watch",
        ) === 0
      ) {
        youTubeNavigations.push(
          ...this.extractYouTubeNavigationsFromWatchPageNavigationBatch(
            topFrameNavigationBatch,
            extension_installation_uuid,
          ),
        );
      } else {
        throw new Error("TODO: Support non-watch-page navigations");
      }
    }

    return youTubeNavigations;
  }

  extractYouTubeNavigationsFromWatchPageNavigationBatch(
    topFrameNavigationBatch: TrimmedNavigationBatch,
    extension_installation_uuid: string,
  ): YouTubeNavigation[] {
    const youTubeNavigations: YouTubeNavigation[] = [];

    // Check for a main_frame watch page http request

    // Check for subsequent xhr watch page http requests

    // Find the main_frame http_responses
    // TODO: Handle subsequent pushState-based navigations
    const topFrameHttpResponseEnvelopes = topFrameNavigationBatch.childEnvelopes.filter(
      childEnvelope =>
        childEnvelope.type === "http_responses" &&
        childEnvelope.httpResponse.frame_id === 0,
    );

    for (const topFrameHttpResponseEnvelope of topFrameHttpResponseEnvelopes) {
      // ... and the corresponding captured content
      const capturedContentEnvelope = topFrameNavigationBatch.childEnvelopes.find(
        childEnvelope =>
          childEnvelope.type === "openwpm_captured_content" &&
          childEnvelope.capturedContent.frame_id === 0 &&
          childEnvelope.capturedContent.content_hash ===
            topFrameHttpResponseEnvelope.httpResponse.content_hash,
      );

      let videoMetadata: VideoMetadata;
      if (capturedContentEnvelope) {
        // Extract video metadata from the captured content
        videoMetadata = this.extractVideoMetadataFromCapturedContent(
          capturedContentEnvelope,
        );
      } else {
        videoMetadata = this.extractVideoMetadataFromNothing();
      }

      const youTubeNavigation: YouTubeNavigation = {
        video_metadata: videoMetadata,
        tab_active_dwell_time_at_navigation:
          topFrameNavigationBatch.navigationEnvelope.tabActiveDwellTime,
        referrer: document ? document.referrer : "<failed>",
        navigation_transition_type:
          topFrameNavigationBatch.navigationEnvelope.navigation.transition_type,
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
        extension_installation_uuid,
        event_uuid: topFrameNavigationBatch.navigationEnvelope.navigation.uuid,
      };
      youTubeNavigations.push(youTubeNavigation);
    }
    return youTubeNavigations;
  }

  extractVideoMetadataFromCapturedContent(
    capturedContentEnvelope,
  ): VideoMetadata {
    const htmlContent = capturedContentEnvelope.capturedContent.decoded_content;
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
          .contents[0].videoPrimaryInfoRenderer.dateText.simpleText;
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
          .contents[0].videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer
          .shortViewCount.simpleText;
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

    return {
      video_id,
      video_title,
      video_description,
      video_posting_date,
      view_count_at_navigation,
      view_count_at_navigation_short,
      outgoing_video_ids_by_category: {
        up_next_auto_play,
        watch_next_column,
        watch_next_end_screen,
      },
    };
  }

  extractVideoMetadataFromNothing(): VideoMetadata {
    let video_id;
    try {
    } catch (err) {
      video_id = "<failed>";
    }

    let video_title;
    try {
    } catch (err) {
      video_title = "<failed>";
    }

    let video_description;
    try {
    } catch (err) {
      video_description = "<failed>";
    }

    let video_posting_date;
    try {
    } catch (err) {
      video_posting_date = "";
    }

    let view_count_at_navigation;
    try {
    } catch (err) {
      view_count_at_navigation = -1;
    }

    let view_count_at_navigation_short;
    try {
    } catch (err) {
      view_count_at_navigation_short = "<failed>";
    }

    let up_next_auto_play;
    try {
    } catch (err) {
      up_next_auto_play = "<failed>";
    }

    let watch_next_column;
    try {
    } catch (err) {
      watch_next_column = "<failed>";
    }

    let watch_next_end_screen;
    try {
    } catch (err) {
      watch_next_end_screen = "<failed>";
    }

    return {
      video_id,
      video_title,
      video_description,
      video_posting_date,
      view_count_at_navigation,
      view_count_at_navigation_short,
      outgoing_video_ids_by_category: {
        up_next_auto_play,
        watch_next_column,
        watch_next_end_screen,
      },
    };
  }
}

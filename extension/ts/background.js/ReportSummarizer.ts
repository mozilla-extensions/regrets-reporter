import {
  NavigationBatch,
  OpenWpmPayloadEnvelope,
  TrimmedNavigationBatch,
} from "./NavigationBatchPreprocessor";

type YouTubeNavigationLinkPosition =
  | "up_next_auto_play"
  | "watch_next_column"
  | "watch_next_end_screen";

type YouTubeNavigationReachType =
  | YouTubeNavigationLinkPosition
  | "direct_navigation"
  | "page_reload"
  | FailedStringAttribute;

type FailedStringAttribute = "<failed>";
type FailedIntegerAttribute = -1;

export interface VideoMetadata {
  video_id: string | FailedStringAttribute;
  video_title: string | FailedStringAttribute;
  video_description: string | FailedStringAttribute;
  video_posting_date: string | FailedStringAttribute;
  view_count_at_navigation: number | FailedIntegerAttribute;
  view_count_at_navigation_short: string | FailedStringAttribute;
}

export type OutgoingVideoIdsByCategory = {
  [position in YouTubeNavigationLinkPosition]: string[] | FailedStringAttribute;
};

export interface VideoPageMetadata {
  video_metadata: VideoMetadata;
  outgoing_video_ids_by_category: OutgoingVideoIdsByCategory;
}

export interface YouTubeNavigation {
  video_metadata: undefined | VideoMetadata;
  outgoing_video_ids_by_category: OutgoingVideoIdsByCategory;
  tab_active_dwell_time_at_navigation: number | FailedIntegerAttribute;
  url: undefined | string | FailedStringAttribute;
  referrer: undefined | string | FailedStringAttribute;
  navigation_transition_type: string;
  parent_youtube_navigations: YouTubeNavigation[];
  how_the_youtube_navigation_likely_was_reached: YouTubeNavigationReachType[];
  window_id: number;
  tab_id: number;
  frame_id: number;
}

export interface RegretReport {
  amount_of_regret_reports_since_consent_was_given: number;
  regretted_youtube_navigation_brief_video_metadata: VideoMetadata;
  how_this_and_recent_youtube_navigations_were_reached: YouTubeNavigationReachType[][];
  user_supplied_regret_category: string;
  user_supplied_other_regret_category: string;
  user_supplied_severity: null | number;
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

  async navigationBatchesByUuidToYouTubeNavigations(navigationBatchesByUuid: {
    [navigationUuid: string]: TrimmedNavigationBatch;
  }): Promise<YouTubeNavigation[]> {
    // Only consider navigations in the top/main frame (no subframes)
    // (this should already be taken care of by the filtering in OpenWpmPacketHandler
    // but keeping for clarity's sake)
    const topFrameNavUuids = Object.keys(navigationBatchesByUuid).filter(
      navUuid =>
        navigationBatchesByUuid[navUuid].navigationEnvelope.navigation
          .frame_id === 0,
    );
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
  ): YouTubeNavigation[] {
    const youTubeNavigations: YouTubeNavigation[] = [];

    // Check for a main_frame watch page http request

    // Check for subsequent xhr watch page http requests

    // Find the main_frame http_responses
    const topFrameHttpResponseEnvelopes = topFrameNavigationBatch.childEnvelopes.filter(
      childEnvelope =>
        childEnvelope.type === "http_responses" &&
        childEnvelope.httpResponse.frame_id === 0,
    );

    for (const topFrameHttpResponseEnvelope of topFrameHttpResponseEnvelopes) {
      // console.log({ topFrameHttpResponseEnvelope });

      // The corresponding http request(s)
      const httpRequestEnvelope = topFrameNavigationBatch.childEnvelopes
        .slice()
        .reverse()
        .find(
          childEnvelope =>
            childEnvelope.type === "http_requests" &&
            childEnvelope.httpRequest.request_id ===
              topFrameHttpResponseEnvelope.httpResponse.request_id,
        );
      // console.log({ httpRequestEnvelope });

      // ... and the corresponding captured content
      const capturedContentEnvelope = topFrameNavigationBatch.childEnvelopes.find(
        childEnvelope =>
          childEnvelope.type === "openwpm_captured_content" &&
          childEnvelope.capturedContent.frame_id === 0 &&
          childEnvelope.capturedContent.content_hash ===
            topFrameHttpResponseEnvelope.httpResponse.content_hash,
      );

      let videoPageMetadata: VideoPageMetadata;
      if (capturedContentEnvelope) {
        // Extract video metadata from the captured content
        videoPageMetadata = this.extractVideoPageMetadataFromCapturedContent(
          httpRequestEnvelope,
          capturedContentEnvelope,
        );
      } else {
        videoPageMetadata = this.extractVideoPageMetadataFromNothing();
      }

      const url = httpRequestEnvelope.httpRequest.url;
      const referrer = httpRequestEnvelope.httpRequest.referrer;
      const navigation_transition_type =
        topFrameNavigationBatch.navigationEnvelope.navigation.transition_type;
      const how_the_youtube_navigation_likely_was_reached: YouTubeNavigationReachType[] = [
        referrer === ""
          ? navigation_transition_type === "reload"
            ? "page_reload"
            : "direct_navigation"
          : "<failed>",
      ];

      const youTubeNavigation: YouTubeNavigation = {
        ...videoPageMetadata,
        tab_active_dwell_time_at_navigation:
          topFrameNavigationBatch.navigationEnvelope.tabActiveDwellTime,
        url,
        referrer,
        navigation_transition_type,
        parent_youtube_navigations: [],
        how_the_youtube_navigation_likely_was_reached,
        window_id:
          topFrameNavigationBatch.navigationEnvelope.navigation.window_id,
        tab_id: topFrameNavigationBatch.navigationEnvelope.navigation.tab_id,
        frame_id:
          topFrameNavigationBatch.navigationEnvelope.navigation.frame_id,
        /*
        event_metadata: {
          client_timestamp:
            topFrameNavigationBatch.navigationEnvelope.navigation
              .committed_time_stamp,
          extension_installation_uuid,
          event_uuid:
            topFrameNavigationBatch.navigationEnvelope.navigation.uuid,
        },
        */
      };
      youTubeNavigations.push(youTubeNavigation);
    }
    return youTubeNavigations;
  }

  extractVideoPageMetadataFromCapturedContent(
    httpRequestEnvelope: OpenWpmPayloadEnvelope,
    capturedContentEnvelope: OpenWpmPayloadEnvelope,
  ): VideoPageMetadata {
    let ytInitialData;

    if (httpRequestEnvelope.httpRequest.is_XHR == 0) {
      // Handle ordinary full page loads
      const htmlContent =
        capturedContentEnvelope.capturedContent.decoded_content;
      const matchArray = htmlContent.match(
        /window\["ytInitialData"\]\s*=\s*(.*);\s*window\["ytInitialPlayerResponse"\]/,
      );
      if (!matchArray) {
        console.error("No MATCH", { matchArray });
      }
      ytInitialData = JSON.parse(matchArray[1]);
    } else {
      // Handle subsequent pushState-based loads
      const jsonContent =
        capturedContentEnvelope.capturedContent.decoded_content;
      const xhrResponse = JSON.parse(jsonContent);
      ytInitialData = xhrResponse[3].response;
    }

    // console.log({ ytInitialData });

    let video_id;
    try {
      video_id = ytInitialData.currentVideoEndpoint.watchEndpoint.videoId;
    } catch (err) {
      console.error("video_id", err.message);
      console.error(ytInitialData.currentVideoEndpoint.watchEndpoint);
      video_id = "<failed>";
    }

    let video_title;
    try {
      video_title =
        ytInitialData.contents.twoColumnWatchNextResults.results.results
          .contents[0].videoPrimaryInfoRenderer.title.runs[0].text;
    } catch (err) {
      console.error("video_title", err.message);
      video_title = "<failed>";
    }

    let video_description;
    try {
      video_description =
        ytInitialData.contents.twoColumnWatchNextResults.results.results
          .contents[1].videoSecondaryInfoRenderer.description.runs[0].text;
    } catch (err) {
      console.error("video_description", err.message);
      video_description = "<failed>";
    }

    let video_posting_date;
    try {
      video_posting_date =
        ytInitialData.contents.twoColumnWatchNextResults.results.results
          .contents[0].videoPrimaryInfoRenderer.dateText.simpleText;
    } catch (err) {
      console.error("video_posting_date", err.message);
      video_posting_date = "";
    }

    let view_count_at_navigation;
    try {
      view_count_at_navigation = ytInitialData.contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer.viewCount.simpleText.replace(
        /\D/g,
        "",
      );
    } catch (err) {
      console.error("view_count_at_navigation", err.message);
      view_count_at_navigation = -1;
    }

    let view_count_at_navigation_short;
    try {
      view_count_at_navigation_short =
        ytInitialData.contents.twoColumnWatchNextResults.results.results
          .contents[0].videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer
          .shortViewCount.simpleText;
    } catch (err) {
      console.error("view_count_at_navigation_short", err.message);
      view_count_at_navigation_short = "<failed>";
    }

    let up_next_auto_play;
    try {
      up_next_auto_play = ytInitialData.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results[0].compactAutoplayRenderer.contents.map(
        el => el.compactVideoRenderer.videoId,
      );
    } catch (err) {
      console.error("up_next_auto_play", err.message);
      up_next_auto_play = "<failed>";
    }

    let watch_next_column;
    try {
      watch_next_column = ytInitialData.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results
        .slice(1)
        .map(el => {
          if (el.compactVideoRenderer) {
            return el.compactVideoRenderer.videoId;
          }
          if (el.compactRadioRenderer) {
            return new URL(el.compactRadioRenderer.shareUrl).searchParams.get(
              "v",
            );
          }
          console.error("watch_next_column unhandled el:");
          console.dir({ el });
        });
    } catch (err) {
      console.error("watch_next_column", err.message);
      console.debug(
        ytInitialData.contents.twoColumnWatchNextResults.secondaryResults
          .secondaryResults,
      );
      watch_next_column = "<failed>";
    }

    let watch_next_end_screen;
    try {
      watch_next_end_screen = ytInitialData.playerOverlays.playerOverlayRenderer.endScreen.watchNextEndScreenRenderer.results.map(
        el => {
          if (el.endScreenVideoRenderer) {
            return el.endScreenVideoRenderer.videoId;
          }
          if (el.endScreenPlaylistRenderer) {
            return el.endScreenPlaylistRenderer.navigationEndpoint.watchEndpoint
              .videoId;
          }
          console.error("watch_next_end_screen unhandled el:");
          console.dir({ el });
        },
      );
    } catch (err) {
      console.error("watch_next_end_screen", err.message);
      console.info(
        ytInitialData.playerOverlays.playerOverlayRenderer.endScreen
          .watchNextEndScreenRenderer,
      );
      watch_next_end_screen = "<failed>";
    }

    return {
      video_metadata: {
        video_id,
        video_title,
        video_description,
        video_posting_date,
        view_count_at_navigation,
        view_count_at_navigation_short,
      },
      outgoing_video_ids_by_category: {
        up_next_auto_play,
        watch_next_column,
        watch_next_end_screen,
      },
    };
  }

  extractVideoPageMetadataFromNothing(): VideoPageMetadata {
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
      video_metadata: {
        video_id,
        video_title,
        video_description,
        video_posting_date,
        view_count_at_navigation,
        view_count_at_navigation_short,
      },
      outgoing_video_ids_by_category: {
        up_next_auto_play,
        watch_next_column,
        watch_next_end_screen,
      },
    };
  }

  async regretReportFromYouTubeNavigations(
    youTubeNavigations: YouTubeNavigation[],
  ): Promise<RegretReport> {
    const mostRecentYouTubeNavigation = youTubeNavigations.slice().pop();
    console.log({ youTubeNavigations, mostRecentYouTubeNavigation });
    return {
      amount_of_regret_reports_since_consent_was_given: -1,
      regretted_youtube_navigation_brief_video_metadata: {
        video_id: "foo",
        video_title: "foo",
        video_description: "",
        video_posting_date: "",
        view_count_at_navigation: -1,
        view_count_at_navigation_short: "",
      },
      how_this_and_recent_youtube_navigations_were_reached: [],
      user_supplied_regret_category: "",
      user_supplied_other_regret_category: "",
      user_supplied_severity: -1,
    };
  }
}

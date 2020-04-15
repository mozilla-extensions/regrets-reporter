import {
  NavigationBatch,
  OpenWpmPayloadEnvelope,
  TrimmedNavigationBatch,
} from "./NavigationBatchPreprocessor";

type YouTubeNavigationLinkPosition =
  | "search_results"
  | "search_page_for_you_recommendations"
  | "up_next_auto_play"
  | "watch_next_column"
  | "watch_next_end_screen";

type YouTubeNavigationReachType =
  | YouTubeNavigationLinkPosition
  | "direct_navigation"
  | "page_reload"
  | FailedStringAttribute;

type YouTubeNavigationUrlType =
  | "search_results"
  | "watch_page"
  | "channel_page";

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
  [position in YouTubeNavigationLinkPosition]?:
    | string[]
    | FailedStringAttribute;
};

export interface VideoPageMetadata {
  video_metadata: VideoMetadata;
  outgoing_video_ids_by_category: OutgoingVideoIdsByCategory;
}

export interface YouTubeNavigation {
  video_metadata?: VideoMetadata;
  outgoing_video_ids_by_category?: OutgoingVideoIdsByCategory;
  tab_active_dwell_time_at_navigation: number | FailedIntegerAttribute;
  url: undefined | string | FailedStringAttribute;
  referrer: undefined | string | FailedStringAttribute;
  parent_youtube_navigations: YouTubeNavigation[];
  how_the_youtube_navigation_likely_was_reached: YouTubeNavigationReachType[];
  window_id: number;
  tab_id: number;
  frame_id: number;
}

export interface RegretReportData {
  regretted_youtube_navigation_video_metadata: VideoMetadata;
  how_this_and_recent_youtube_navigations_were_reached: YouTubeNavigationReachType[][];
}

export interface RegretReport {
  report_data: RegretReportData;
  user_supplied_regret_category: string;
  user_supplied_other_regret_category: string;
  user_supplied_severity: null | number;
  user_supplied_optional_comment: string;
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
    /*
    const jsonContent =
      capturedContentEnvelope.capturedContent.decoded_content;
    const xhrResponse = JSON.parse(jsonContent);
    console.dir({xhrResponse}, {depth: 5});

    { xhrResponse:
   [ { rootVe: 3832, page: 'watch', csn: 'IJSVXvy6EbP57QTznJuQDg' },
     { page: 'watch',
       preconnect:
        [ 'https://r8---sn-qo5-2vgl.googlevideo.com/generate_204',
          'https://r8---sn-qo5-2vgl.googlevideo.com/generate_204?conn2' ] },
     { page: 'watch',
       player:
        { args:
           { cbrver: '76.0',
             cbr: 'Firefox',
             show_miniplayer_button: '1',
             innertube_api_key: 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
             use_miniplayer_ui: '1',
             player_response: LONG
    */

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
      youTubeNavigations.push(
        ...this.extractYouTubeNavigationsFromNavigationBatch(
          topFrameNavigationBatch,
        ),
      );
    }

    return youTubeNavigations;
  }

  extractYouTubeNavigationsFromNavigationBatch(
    topFrameNavigationBatch: TrimmedNavigationBatch,
  ): YouTubeNavigation[] {
    const youTubeNavigations: YouTubeNavigation[] = [];

    // Find the main_frame http_responses
    const topFrameHttpResponseEnvelopes = topFrameNavigationBatch.childEnvelopes.filter(
      childEnvelope =>
        childEnvelope.type === "http_responses" &&
        childEnvelope.httpResponse.frame_id === 0,
    );

    let i = -1;
    for (const topFrameHttpResponseEnvelope of topFrameHttpResponseEnvelopes) {
      i = i + 1;
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

      const url = httpRequestEnvelope.httpRequest.url;
      const referrer = httpRequestEnvelope.httpRequest.referrer;
      const resource_type = httpRequestEnvelope.httpRequest.resource_type;
      const navigation_transition_type =
        topFrameNavigationBatch.navigationEnvelope.navigation.transition_type;
      console.debug("* extractYouTubeNavigationsFromNavigationBatch debug:", {
        url,
        referrer,
        navigation_transition_type,
        resource_type,
      });

      // These do not correspond to actual user usage
      if (url.indexOf("prefetch=1") > 0) {
        continue;
      }

      const how_the_youtube_navigation_likely_was_reached: YouTubeNavigationReachType[] = [];
      if (i === 0) {
        if (navigation_transition_type === "typed") {
          how_the_youtube_navigation_likely_was_reached.push(
            "direct_navigation",
          );
        } else if (navigation_transition_type === "reload") {
          how_the_youtube_navigation_likely_was_reached.push("page_reload");
        }
      } else {
        // link
      }

      // Extract video metadata from the captured content if available
      let videoPageMetadata: VideoPageMetadata = {
        video_metadata: undefined,
        outgoing_video_ids_by_category: {},
      };
      if (capturedContentEnvelope) {
        // Check what kind of page was visited and run the appropriate extraction methods
        if (url.indexOf("https://www.youtube.com/watch") === 0) {
          videoPageMetadata = this.extractVideoPageMetadataFromCapturedWatchPageContent(
            httpRequestEnvelope,
            capturedContentEnvelope,
          );
        } else if (
          url.indexOf("https://www.youtube.com/results?search_query=") === 0
        ) {
          videoPageMetadata = this.extractVideoPageMetadataFromCapturedSearchResultsPageContent(
            httpRequestEnvelope,
            capturedContentEnvelope,
          );
        } else {
          console.warn("Unsupported navigation", { url });
        }
      }

      const youTubeNavigation: YouTubeNavigation = {
        ...videoPageMetadata,
        tab_active_dwell_time_at_navigation:
          topFrameNavigationBatch.navigationEnvelope.tabActiveDwellTime,
        url,
        referrer,
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

  extractVideoPageMetadataFromCapturedWatchPageContent(
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
      const xhrResponseItemWithYtInitialData = xhrResponse.find(
        xhrResponseItem => {
          return xhrResponseItem.response !== undefined;
        },
      );
      if (!xhrResponseItemWithYtInitialData) {
        console.error("No xhrResponseItemWithYtInitialData");
        console.dir({ xhrResponse }, { depth: 4 });
      }
      ytInitialData = xhrResponseItemWithYtInitialData.response;
      // console.dir({ ytInitialData }, {depth: 5});
    }

    if (!ytInitialData) {
      console.warn("ytInitialData is empty");
    }

    let video_id;
    try {
      video_id = ytInitialData.currentVideoEndpoint.watchEndpoint.videoId;
    } catch (err) {
      console.error("video_id", err.message);
      // console.dir({ ytInitialData }, {depth: 5});
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
      view_count_at_navigation = parseInt(
        ytInitialData.contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer.viewCount.simpleText.replace(
          /\D/g,
          "",
        ),
        10,
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
          if (el.compactPlaylistRenderer) {
            return el.compactPlaylistRenderer.navigationEndpoint.watchEndpoint
              .videoId;
          }
          if (el.compactRadioRenderer) {
            return new URL(el.compactRadioRenderer.shareUrl).searchParams.get(
              "v",
            );
          }
          if (el.promotedSparklesWebRenderer) {
            return "(ad)";
          }
          console.error("watch_next_column unhandled el:");
          console.dir({ el });
        });
    } catch (err) {
      console.error("watch_next_column", err.message);
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

  extractVideoPageMetadataFromCapturedSearchResultsPageContent(
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
      // console.dir({ xhrResponse }, { depth: 5 });
      ytInitialData = xhrResponse.find(
        xhrResponseItem => xhrResponseItem.response,
      );
    }

    // console.log({ ytInitialData });

    let search_results;
    let search_page_for_you_recommendations;
    try {
      // console.dir(ytInitialData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents, { depth: 8 });
      search_results = ytInitialData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents.map(
        el => {
          if (el.videoRenderer) {
            return el.videoRenderer.videoId;
          }
          if (el.playlistRenderer) {
            return el.playlistRenderer.navigationEndpoint.watchEndpoint.videoId;
          }
          if (el.horizontalCardListRenderer) {
            return "(related-searches)";
          }
          if (
            el.shelfRenderer &&
            el.shelfRenderer.title.simpleText === "For you"
          ) {
            try {
              search_page_for_you_recommendations = el.shelfRenderer.content.verticalListRenderer.items.map(
                el => {
                  if (el.videoRenderer) {
                    return el.videoRenderer.videoId;
                  }
                  console.error(
                    "search_page_for_you_recommendations unhandled el:",
                  );
                  console.dir({ el }, { depth: 4 });
                },
              );
            } catch (err) {
              search_page_for_you_recommendations = "<failed>";
            }
            return "(for-you-recommendations)";
          }
          console.error("search_results unhandled el:");
          console.dir({ el }, { depth: 4 });
        },
      );
    } catch (err) {
      console.error("search_results", err.message);
      search_results = "<failed>";
    }

    return {
      video_metadata: undefined,
      outgoing_video_ids_by_category: {
        search_results,
        search_page_for_you_recommendations,
      },
    };
  }

  async regretReportDataFromYouTubeNavigations(
    youTubeNavigations: YouTubeNavigation[],
  ): Promise<RegretReportData> {
    if (youTubeNavigations.length === 0) {
      throw new Error("No YouTube navigations captured yet");
    }
    const mostRecentYouTubeNavigation = youTubeNavigations.slice().pop();
    // console.log({ youTubeNavigations, mostRecentYouTubeNavigation });
    return {
      regretted_youtube_navigation_video_metadata:
        mostRecentYouTubeNavigation.video_metadata,
      how_this_and_recent_youtube_navigations_were_reached: mostRecentYouTubeNavigation.parent_youtube_navigations.map(
        pyn => pyn.how_the_youtube_navigation_likely_was_reached,
      ),
    };
  }
}

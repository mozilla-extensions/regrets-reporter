import {
  NavigationBatch,
  OpenWpmPayloadEnvelope,
  TrimmedNavigationBatch,
  TrimmedNavigationBatchesByUuid,
} from "./NavigationBatchPreprocessor";
import { OpenWPMObjectifiedEventTarget } from "@openwpm/webext-instrumentation";
import {
  classifyYouTubeNavigationUrlType,
  YouTubeNavigationUrlType,
} from "./lib/youTubeNavigationUrlType";
import { YouTubeUsageStatisticsUpdate } from "./YouTubeUsageStatistics";

type YouTubeNavigationLinkPosition =
  | "search_results"
  | "search_results_page_for_you_indirect_videos"
  | "search_results_page_other_indirect_videos"
  | "watch_next_column"
  | "watch_next_end_screen";

export type YouTubeNavigationReachType =
  | "search_results_video_click"
  | "search_results_non_video_click"
  | "search_results_page_for_you_indirect_videos_click"
  | "search_results_page_other_indirect_videos_click"
  | "from_watch_page_up_next_column_click"
  | "from_watch_page_watch_next_end_screen_click"
  // | "search_action"
  | "direct_navigation"
  | "page_reload"
  | "clicked_link"
  | "unspecified"
  | "without_clicking_at_all"
  | "without_categorized_clicks"
  | FailedStringAttribute;

export type YouTubePageEntryPoint =
  | "search_results_page"
  | "watch_page"
  | "user_page"
  | "channel_page"
  | "youtube_main_page"
  | "direct_navigation"
  | "page_reload"
  | "not_a_youtube_page"
  | "other"
  | FailedStringAttribute;

type FailedStringAttribute = "<failed>";
type FailedIntegerAttribute = -1;
type FailedBooleanAttribute = null;

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

export interface YouTubePageMetadata {
  video_metadata: VideoMetadata;
  outgoing_video_ids_by_category: OutgoingVideoIdsByCategory;
}

export interface YouTubeVisitMetadata {
  reach_type: YouTubeNavigationReachType;
  url_type: YouTubeNavigationUrlType;
}

export interface YouTubeNavigation {
  video_metadata?: VideoMetadata;
  outgoing_video_ids_by_category?: OutgoingVideoIdsByCategory;
  tab_active_dwell_time_at_navigation: number | FailedIntegerAttribute;
  url: undefined | string | FailedStringAttribute;
  referrer_url: undefined | string | FailedStringAttribute;
  parent_youtube_navigations: YouTubeNavigation[];
  youtube_visit_metadata: YouTubeVisitMetadata;
  time_stamp: string;
  window_id: number;
  tab_id: number;
  frame_id: number;
  event_ordinal: number;
}

export interface YouTubeNavigationMetadata {
  video_metadata?: VideoMetadata;
  url_type: YouTubeNavigationUrlType;
  page_entry_point: YouTubePageEntryPoint;
  via_search_results: boolean | FailedBooleanAttribute;
  via_non_search_algorithmic_recommendations_content:
    | boolean
    | FailedBooleanAttribute;
  via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for:
    | boolean
    | FailedBooleanAttribute;
}

export interface YouTubeNavigationSpecificRegretReportData {
  youtube_navigation_metadata: YouTubeNavigationMetadata;
  parent_youtube_navigations_metadata: YouTubeNavigationMetadata[];
}

export interface RegretReportData
  extends YouTubeNavigationSpecificRegretReportData {
  youtube_usage_statistics_update: YouTubeUsageStatisticsUpdate;
}

export interface RegretReport {
  report_data: RegretReportData;
  user_supplied_regret_categories: string[];
  user_supplied_other_regret_category: string;
  user_supplied_severity: number;
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
      trimmedUiInteractionCount: -1,
      trimmedUiStateCount: -1,
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

  async navigationBatchesByUuidToYouTubeNavigations(
    navigationBatchesByUuid: TrimmedNavigationBatchesByUuid,
  ): Promise<YouTubeNavigation[]> {
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
          navigationBatchesByUuid,
        ),
      );
    }

    return youTubeNavigations;
  }

  extractYouTubeNavigationsFromNavigationBatch(
    topFrameNavigationBatch: TrimmedNavigationBatch,
    navigationBatchesByUuid: TrimmedNavigationBatchesByUuid,
  ): YouTubeNavigation[] {
    const youTubeNavigations: YouTubeNavigation[] = [];

    // Find the main_frame http_responses
    const topFrameHttpResponseEnvelopes = topFrameNavigationBatch.childEnvelopes.filter(
      childEnvelope =>
        childEnvelope.type === "http_responses" &&
        childEnvelope.httpResponse.frame_id === 0,
    );

    const clickEventEnvelopes = topFrameNavigationBatch.childEnvelopes.filter(
      childEnvelope =>
        childEnvelope.type === "ui_interactions" &&
        childEnvelope.uiInteraction.frame_id === 0,
    );

    let i = -1;
    for (const topFrameHttpResponseEnvelope of topFrameHttpResponseEnvelopes) {
      i = i + 1;
      // console.log({ topFrameHttpResponseEnvelope });

      // The corresponding http request(s)

      const httpRequestEnvelopeMatcher = childEnvelope =>
        childEnvelope.type === "http_requests" &&
        childEnvelope.httpRequest.request_id ===
          topFrameHttpResponseEnvelope.httpResponse.request_id;

      let httpRequestEnvelope = topFrameNavigationBatch.childEnvelopes
        .slice()
        .reverse()
        .find(httpRequestEnvelopeMatcher);
      // console.log({ httpRequestEnvelope });

      // Sometimes the http request envelope was created within the lifespan of a previous webNavigation,
      // thus we need to also check other navigation batches if it resides over there
      if (!httpRequestEnvelope) {
        Object.keys(navigationBatchesByUuid).forEach(navUuid => {
          const matchingHttpRequestEnvelope = navigationBatchesByUuid[
            navUuid
          ].childEnvelopes
            .slice()
            .reverse()
            .find(httpRequestEnvelopeMatcher);
          if (matchingHttpRequestEnvelope) {
            httpRequestEnvelope = matchingHttpRequestEnvelope;
          }
        });
      }

      // If the http request is still not found, it is unexpected
      if (!httpRequestEnvelope) {
        throw new Error(
          `The matching httpRequestEnvelope was not found for request id ${topFrameHttpResponseEnvelope.httpResponse.request_id}`,
        );
      }

      // ... and the corresponding captured content
      const capturedContentEnvelope = topFrameNavigationBatch.childEnvelopes.find(
        childEnvelope =>
          childEnvelope.type === "openwpm_captured_content" &&
          childEnvelope.capturedContent.frame_id === 0 &&
          childEnvelope.capturedContent.content_hash ===
            topFrameHttpResponseEnvelope.httpResponse.content_hash,
      );

      const url = httpRequestEnvelope.httpRequest.url;
      const referrer_url = httpRequestEnvelope.httpRequest.referrer;
      const url_type = classifyYouTubeNavigationUrlType(url);
      // const resource_type = httpRequestEnvelope.httpRequest.resource_type;
      const navigation_transition_type =
        topFrameNavigationBatch.navigationEnvelope.navigation.transition_type;
      const event_ordinal = httpRequestEnvelope.httpRequest.event_ordinal;

      // console.debug("* extractYouTubeNavigationsFromNavigationBatch debug:", {url, referrer_url, navigation_transition_type, resource_type});

      // These do not correspond to actual user usage
      if (url_type === "prefetch") {
        continue;
      }

      // Extract video metadata from the captured content if available
      let youtubePageMetadata: YouTubePageMetadata = {
        video_metadata: undefined,
        outgoing_video_ids_by_category: {},
      };
      if (capturedContentEnvelope) {
        // Check what kind of page was visited and run the appropriate extraction methods
        if (url_type === "watch_page") {
          youtubePageMetadata = this.extractYouTubePageMetadataFromCapturedWatchPageContent(
            httpRequestEnvelope,
            capturedContentEnvelope,
          );
        } else if (url_type === "search_results_page") {
          youtubePageMetadata = this.extractYouTubePageMetadataFromCapturedSearchResultsPageContent(
            httpRequestEnvelope,
            capturedContentEnvelope,
          );
        } else {
          /*
          console.warn("No video metadata is extracted for this url type", {
            url,
            url_type,
          });
          */
        }
      }

      let parent_youtube_navigations;
      let parentYouTubeNavigation;
      let reach_type: YouTubeNavigationReachType;
      if (i === 0) {
        if (
          [
            "typed",
            "auto_bookmark",
            "generated",
            "start_page",
            "form_submit",
            "keyword",
            "keyword_generated",
          ].includes(navigation_transition_type)
        ) {
          reach_type = "direct_navigation";
        } else if (navigation_transition_type === "reload") {
          reach_type = "page_reload";
        } else if (navigation_transition_type === "link") {
          reach_type = "clicked_link";
        }
        // TODO: Check referrer_url, timing and other transition types
        parent_youtube_navigations = youTubeNavigations
          .slice()
          .reverse()
          .slice(0, 5);
        parentYouTubeNavigation = parent_youtube_navigations.slice().shift();
      } else {
        // TODO: Only consider those within the same tab
        parent_youtube_navigations = youTubeNavigations
          .slice()
          .reverse()
          .slice(0, 5);
        parentYouTubeNavigation = parent_youtube_navigations.slice().shift();
      }

      if (!reach_type && parentYouTubeNavigation) {
        // console.dir({parentYouTubeNavigation}, {depth: 5});
        // console.dir({clickEventEnvelopes}, {depth: 5});

        // click events leading up to the subsequent youtube navigation
        const firstRelevantEventOrdinal = parentYouTubeNavigation.event_ordinal;
        const lastRelevantEventOrdinal =
          topFrameHttpResponseEnvelope.httpResponse.event_ordinal;
        // const lastRelevantEventOrdinal = nextTopFrameHttpResponseEnvelopes ? nextTopFrameHttpResponseEnvelopes.httpResponse.event_ordinal : Number.MAX_SAFE_INTEGER;

        // console.log({firstRelevantEventOrdinal,lastRelevantEventOrdinal });

        const clickEventEnvelopesForParentYouTubeNavigation = clickEventEnvelopes.filter(
          childEnvelope =>
            childEnvelope.uiInteraction.event_ordinal >
              firstRelevantEventOrdinal &&
            childEnvelope.uiInteraction.event_ordinal <
              lastRelevantEventOrdinal,
        );
        // console.dir({clickEventEnvelopesForParentYouTubeNavigation}, {depth: 5});

        // Check what kind of page was visited and run the appropriate extraction methods
        const parentYouTubeNavigationUrlType =
          parentYouTubeNavigation.youtube_visit_metadata.url_type;
        if (parentYouTubeNavigationUrlType === "watch_page") {
          reach_type = this.extractReachTypeFromWatchPageData(
            clickEventEnvelopesForParentYouTubeNavigation,
            parentYouTubeNavigation,
            youtubePageMetadata,
            url_type,
          );
        } else if (parentYouTubeNavigationUrlType === "search_results_page") {
          reach_type = this.extractReachTypeFromSearchResultsPageData(
            clickEventEnvelopesForParentYouTubeNavigation,
            parentYouTubeNavigation,
            youtubePageMetadata,
            url_type,
          );
        } else {
          reach_type = "unspecified";
          /*
          console.warn("No reach type is extracted for this url type", {
            url: parentYouTubeNavigation.url,
            url_type: parentYouTubeNavigationUrlType,
          });
          */
        }
      }

      const youTubeNavigation: YouTubeNavigation = {
        ...youtubePageMetadata,
        tab_active_dwell_time_at_navigation:
          topFrameNavigationBatch.navigationEnvelope.tabActiveDwellTime,
        url,
        referrer_url,
        parent_youtube_navigations,
        youtube_visit_metadata: {
          url_type,
          reach_type,
        },
        time_stamp:
          topFrameNavigationBatch.navigationEnvelope.navigation
            .committed_time_stamp,
        window_id:
          topFrameNavigationBatch.navigationEnvelope.navigation.window_id,
        tab_id: topFrameNavigationBatch.navigationEnvelope.navigation.tab_id,
        frame_id:
          topFrameNavigationBatch.navigationEnvelope.navigation.frame_id,
        event_ordinal,
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

  extractYouTubePageMetadataFromCapturedWatchPageContent(
    httpRequestEnvelope: OpenWpmPayloadEnvelope,
    capturedContentEnvelope: OpenWpmPayloadEnvelope,
  ): YouTubePageMetadata {
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
    let video_posting_date;
    let view_count_at_navigation_short;
    let view_count_at_navigation;

    try {
      const twoColumnWatchNextResultsResultsResultsContentsWithVideoPrimaryInfoRenderer = ytInitialData.contents.twoColumnWatchNextResults.results.results.contents.find(
        contents => {
          return contents.videoPrimaryInfoRenderer !== undefined;
        },
      );

      try {
        video_title =
          twoColumnWatchNextResultsResultsResultsContentsWithVideoPrimaryInfoRenderer
            .videoPrimaryInfoRenderer.title.runs[0].text;
      } catch (err) {
        console.error("video_title", err.message);
        video_title = "<failed>";
      }

      try {
        video_posting_date =
          twoColumnWatchNextResultsResultsResultsContentsWithVideoPrimaryInfoRenderer
            .videoPrimaryInfoRenderer.dateText.simpleText;
      } catch (err) {
        console.error("video_posting_date", err.message);
        video_posting_date = "";
      }

      try {
        view_count_at_navigation = parseInt(
          twoColumnWatchNextResultsResultsResultsContentsWithVideoPrimaryInfoRenderer.videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer.viewCount.simpleText.replace(
            /\D/g,
            "",
          ),
          10,
        );
      } catch (err) {
        console.error("view_count_at_navigation", err.message);
        view_count_at_navigation = -1;
      }

      try {
        view_count_at_navigation_short =
          twoColumnWatchNextResultsResultsResultsContentsWithVideoPrimaryInfoRenderer
            .videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer
            .shortViewCount.simpleText;
      } catch (err) {
        console.error("view_count_at_navigation_short", err.message);
        view_count_at_navigation_short = "<failed>";
      }
    } catch (err) {
      console.error("video_* within videoPrimaryInfoRenderer", err.message);
      video_title = "<failed>";
    }

    let video_description;
    try {
      const twoColumnWatchNextResultsResultsResultsContentsWithVideoSecondaryInfoRenderer = ytInitialData.contents.twoColumnWatchNextResults.results.results.contents.find(
        contents => {
          return contents.videoSecondaryInfoRenderer !== undefined;
        },
      );
      video_description =
        twoColumnWatchNextResultsResultsResultsContentsWithVideoSecondaryInfoRenderer
          .videoSecondaryInfoRenderer.description.runs[0].text;
    } catch (err) {
      console.error("video_description", err.message);
      video_description = "<failed>";
    }

    /*
    const videoIdFromSecondaryResultsItem = el => {
      if (el.compactAutoplayRenderer) {
        return el.compactAutoplayRenderer.contents
          .map(el => el.compactVideoRenderer.videoId)
          .join(",");
      }
      if (el.compactVideoRenderer) {
        return el.compactVideoRenderer.videoId;
      }
      if (el.compactPlaylistRenderer) {
        return el.compactPlaylistRenderer.navigationEndpoint.watchEndpoint
          .videoId;
      }
      if (el.compactRadioRenderer) {
        return new URL(el.compactRadioRenderer.shareUrl).searchParams.get("v");
      }
      if (el.promotedSparklesWebRenderer) {
        return "(ad)";
      }
      if (el.compactPromotedVideoRenderer) {
        return el.compactPromotedVideoRenderer.videoId;
      }
      console.error("watch_next_column unhandled el:");
      console.dir({ el });
    };
    */

    /*
    let up_next_auto_play;
    try {
      up_next_auto_play = ytInitialData.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results[0].compactAutoplayRenderer.contents.map(
        el => el.compactVideoRenderer.videoId,
      );
    } catch (err) {
      console.error("up_next_auto_play", err.message, ytInitialData.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results);
      up_next_auto_play = "<failed>";
    }
    */

    /*
    let watch_next_column;
    try {
      watch_next_column = ytInitialData.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results.map(
        el => {
          const videoId = videoIdFromSecondaryResultsItem(el);
          if (!videoId) {
            console.error("watch_next_column unhandled el:");
            console.dir({ el });
          }
          return videoId;
        },
      );
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
    */

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
        // watch_next_column,
        // watch_next_end_screen,
      },
    };
  }

  extractYouTubePageMetadataFromCapturedSearchResultsPageContent(
    httpRequestEnvelope: OpenWpmPayloadEnvelope,
    capturedContentEnvelope: OpenWpmPayloadEnvelope,
  ): YouTubePageMetadata {
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

    // console.log({ httpRequestEnvelope, ytInitialData });

    let search_results;
    let search_results_page_for_you_indirect_videos;
    let search_results_page_other_indirect_videos;
    try {
      // console.dir(ytInitialData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents, { depth: 8 });
      search_results = ytInitialData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents.map(
        el => {
          if (el.videoRenderer) {
            return el.videoRenderer.videoId;
          }
          if (el.channelRenderer) {
            return "(channel)";
          }
          if (el.searchPyvRenderer) {
            return "(ad)";
          }
          if (el.playlistRenderer) {
            return el.playlistRenderer.navigationEndpoint.watchEndpoint.videoId;
          }
          if (el.radioRenderer) {
            return el.radioRenderer.navigationEndpoint.watchEndpoint.videoId;
          }
          if (el.horizontalCardListRenderer) {
            return "(horizontal-card-list)";
          }
          // Assume shelf-rendered items are not direct search results
          if (el.shelfRenderer) {
            try {
              const video_ids = el.shelfRenderer.content.verticalListRenderer.items.map(
                el => {
                  if (el.videoRenderer) {
                    return el.videoRenderer.videoId;
                  }
                  console.error(
                    "search_results_page_other_indirect_videos unhandled el:",
                  );
                  console.dir({ el }, { depth: 4 });
                },
              );
              if (el.shelfRenderer.title.simpleText === "For you") {
                search_results_page_for_you_indirect_videos = video_ids;
              } else {
                search_results_page_other_indirect_videos = video_ids;
              }
            } catch (err) {
              search_results_page_other_indirect_videos = "<failed>";
            }
            return "(indirect-videos)";
          }
          console.error("search_results unhandled el:");
          console.dir({ el }, { depth: 4 });
        },
      );
    } catch (err) {
      console.error("search_results", err.message);
      console.dir({ ytInitialData }, { depth: 4 });
      search_results = "<failed>";
    }

    return {
      video_metadata: undefined,
      outgoing_video_ids_by_category: {
        search_results,
        search_results_page_other_indirect_videos,
      },
    };
  }

  extractReachTypeFromWatchPageData(
    clickEventEnvelopesForParentYouTubeNavigation: OpenWpmPayloadEnvelope[],
    parentYouTubeNavigation: YouTubeNavigation,
    youtubePageMetadata: YouTubePageMetadata,
    url_type: YouTubeNavigationUrlType,
  ): YouTubeNavigationReachType {
    let clickedWithinRelated = false;
    let clickedEndScreenUpNextAutoplayButton = false;
    let clickedEndScreenCancelUpNextAutoplayButton = false;
    clickEventEnvelopesForParentYouTubeNavigation.map(clickEventEnvelope => {
      const composedPath = JSON.parse(
        clickEventEnvelope.uiInteraction.composed_path,
      );
      // console.dir({ composedPath }, { depth: 5 });
      if (
        !!composedPath.find(
          (eventTarget: OpenWPMObjectifiedEventTarget) =>
            eventTarget.xpath === "//*[@id='related']",
        )
      ) {
        clickedWithinRelated = true;
      }
      if (
        !!composedPath.find(
          (eventTarget: OpenWPMObjectifiedEventTarget) =>
            eventTarget.xpath.indexOf("//*[@id='movie_player']") === 0 &&
            eventTarget.outerHTMLWithoutInnerHTML.indexOf(
              "ytp-upnext-autoplay-icon",
            ) > 0,
        )
      ) {
        clickedEndScreenUpNextAutoplayButton = true;
      }
      if (
        !!composedPath.find(
          (eventTarget: OpenWPMObjectifiedEventTarget) =>
            eventTarget.xpath.indexOf("//*[@id='movie_player']") === 0 &&
            eventTarget.outerHTMLWithoutInnerHTML.indexOf(
              "ytp-upnext-cancel-button",
            ) > 0,
        )
      ) {
        clickedEndScreenCancelUpNextAutoplayButton = true;
      }
    });

    // console.log({clickedWithinRelated, clickedEndScreenUpNextAutoplayButton, clickedEndScreenCancelUpNextAutoplayButton});

    if (clickEventEnvelopesForParentYouTubeNavigation.length === 0) {
      return "without_clicking_at_all";
    } else if (
      !clickedWithinRelated &&
      !clickedEndScreenUpNextAutoplayButton &&
      !clickedEndScreenCancelUpNextAutoplayButton
    ) {
      return "without_categorized_clicks";
    } else {
      // console.debug({ referrer_url });

      /*
      const parentYouTubeNavigationOutgoingLinkCategories = Object.keys(
        parentYouTubeNavigation.outgoing_video_ids_by_category,
      );
      console.log({ parentYouTubeNavigationOutgoingLinkCategories });
      */

      // console.log("youtubePageMetadata.video_metadata.video_id", youtubePageMetadata.video_metadata.video_id);
      // console.dir(parentYouTubeNavigation.outgoing_video_ids_by_category, {depth: 5});

      // Possible TODO: If the additional video check below is to be instantiated in the future, it must support
      // the possibility that the user loaded more results before clicking

      /*
      let parentWatchNextColumnIncludesThisVideoId;
      if (
        url_type === "watch_page" &&
        youtubePageMetadata.video_metadata &&
        parentYouTubeNavigation.outgoing_video_ids_by_category.watch_next_column
      ) {
        parentWatchNextColumnIncludesThisVideoId = parentYouTubeNavigation.outgoing_video_ids_by_category.watch_next_column.includes(
          youtubePageMetadata.video_metadata.video_id,
        );
      }
      */
      if (
        url_type === "watch_page" &&
        clickedWithinRelated
        /* && parentWatchNextColumnIncludesThisVideoId*/
      ) {
        return "from_watch_page_up_next_column_click";
      }

      /*
      let parentWatchNextEndScreenIncludesThisVideoId;
      if (
        url_type === "watch_page" &&
        parentYouTubeNavigation.outgoing_video_ids_by_category
          .watch_next_end_screen
      ) {
        parentWatchNextEndScreenIncludesThisVideoId = parentYouTubeNavigation.outgoing_video_ids_by_category.watch_next_end_screen.includes(
          youtubePageMetadata.video_metadata.video_id,
        );
      }
      */
      if (
        url_type === "watch_page" &&
        clickedEndScreenUpNextAutoplayButton
        /* && parentWatchNextEndScreenIncludesThisVideoId */
      ) {
        return "from_watch_page_watch_next_end_screen_click";
      }
    }
    return "<failed>";
  }

  extractReachTypeFromSearchResultsPageData(
    clickEventEnvelopesForParentYouTubeNavigation: OpenWpmPayloadEnvelope[],
    parentYouTubeNavigation: YouTubeNavigation,
    youtubePageMetadata: YouTubePageMetadata,
    url_type: YouTubeNavigationUrlType,
  ): YouTubeNavigationReachType {
    let clickedWithinSearchResults = false;
    let clickedWithinSearchPageNotSearchResults = false;
    clickEventEnvelopesForParentYouTubeNavigation.map(clickEventEnvelope => {
      const composedPath = JSON.parse(
        clickEventEnvelope.uiInteraction.composed_path,
      );
      // console.dir({ composedPath }, { depth: 5 });
      if (
        !!composedPath.find(
          (eventTarget: OpenWPMObjectifiedEventTarget) =>
            eventTarget.xpath ===
            "//*[@id='container']/ytd-two-column-search-results-renderer",
        )
      ) {
        clickedWithinSearchResults = true;
      }
      if (
        !!composedPath.find(
          (eventTarget: OpenWPMObjectifiedEventTarget) =>
            eventTarget.xpath === "//*[@id='contents']/ytd-shelf-renderer",
        )
      ) {
        clickedWithinSearchPageNotSearchResults = true;
      }
    });

    // console.log({clickedWithinSearchResults, clickedWithinSearchPageNotSearchResults,});

    if (clickEventEnvelopesForParentYouTubeNavigation.length === 0) {
      return "without_clicking_at_all";
    } else if (
      !clickedWithinSearchResults &&
      !clickedWithinSearchPageNotSearchResults
    ) {
      return "without_categorized_clicks";
    } else {
      // console.debug({ referrer_url });

      /*
      if (url_type === "watch_page") {
        console.log(
          "youtubePageMetadata.video_metadata.video_id",
          youtubePageMetadata.video_metadata.video_id,
        );
        console.dir(parentYouTubeNavigation.outgoing_video_ids_by_category, {
          depth: 5,
        });
      }
      */

      if (
        url_type === "watch_page" &&
        clickedWithinSearchPageNotSearchResults
      ) {
        let searchResultsPageForYouIndirectVideosIncludesThisVideoId;
        // TODO: Make sure to support also clicks on "+X More" (currently they are not included in the video ids)
        if (
          parentYouTubeNavigation.outgoing_video_ids_by_category
            .search_results_page_for_you_indirect_videos
        ) {
          searchResultsPageForYouIndirectVideosIncludesThisVideoId = parentYouTubeNavigation.outgoing_video_ids_by_category.search_results_page_for_you_indirect_videos.includes(
            youtubePageMetadata.video_metadata.video_id,
          );
        }
        if (searchResultsPageForYouIndirectVideosIncludesThisVideoId) {
          return "search_results_page_for_you_indirect_videos_click";
        }
        return "search_results_page_other_indirect_videos_click";
      }

      if (url_type === "search_results_page" && clickedWithinSearchResults) {
        return "search_results_video_click";
      }
      if (clickedWithinSearchResults) {
        return "search_results_non_video_click";
      }
    }
    return "<failed>";
  }

  youTubeNavigationMetadataFromYouTubeNavigation = (
    youTubeNavigation: YouTubeNavigation,
  ): YouTubeNavigationMetadata => {
    const metadata: YouTubeNavigationMetadata = {
      url_type: youTubeNavigation.youtube_visit_metadata.url_type,
      page_entry_point: this.pageEntryPointFromYouTubeNavigation(
        youTubeNavigation,
      ),
      via_search_results: this.viaSearchResultsFromYouTubeNavigation(
        youTubeNavigation,
      ),
      via_non_search_algorithmic_recommendations_content: this.viaNonSearchAlgorithmicRecommendationsContentFromYouTubeNavigation(
        youTubeNavigation,
      ),
      via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: this.viaRecommendationsWithAnExplicitQueryOrConstraintToOptimizeForFromYouTubeNavigation(
        youTubeNavigation,
      ),
    };
    if (youTubeNavigation.youtube_visit_metadata.url_type === "watch_page") {
      metadata.video_metadata = youTubeNavigation.video_metadata;
    }
    return metadata;
  };

  parentUrlTypeFromYouTubeNavigation(
    youTubeNavigation: YouTubeNavigation,
  ): YouTubeNavigationUrlType {
    const parentYouTubeNavigation = youTubeNavigation.parent_youtube_navigations
      .slice()
      .shift();
    return parentYouTubeNavigation
      ? parentYouTubeNavigation.youtube_visit_metadata.url_type
      : classifyYouTubeNavigationUrlType(youTubeNavigation.referrer_url);
  }

  pageEntryPointFromYouTubeNavigation(
    youTubeNavigation: YouTubeNavigation,
  ): YouTubePageEntryPoint {
    if (
      youTubeNavigation.youtube_visit_metadata.reach_type ===
      "direct_navigation"
    ) {
      return "direct_navigation";
    }
    if (youTubeNavigation.youtube_visit_metadata.reach_type === "page_reload") {
      return "page_reload";
    }
    const parentUrlType = this.parentUrlTypeFromYouTubeNavigation(
      youTubeNavigation,
    );
    if (parentUrlType === "search_results_page") {
      return "search_results_page";
    }
    if (parentUrlType === "watch_page") {
      return "watch_page";
    }
    if (parentUrlType === "user_page") {
      return "user_page";
    }
    if (parentUrlType === "channel_page") {
      return "channel_page";
    }
    if (parentUrlType === "youtube_main_page") {
      return "youtube_main_page";
    }
    if (parentUrlType === "not_a_youtube_page") {
      return "not_a_youtube_page";
    }
    if (parentUrlType === "<failed>") {
      return "<failed>";
    }
    return "other";
  }

  viaSearchResultsFromYouTubeNavigation(
    youTubeNavigation: YouTubeNavigation,
  ): boolean | FailedBooleanAttribute {
    if (
      youTubeNavigation.youtube_visit_metadata.reach_type ===
      "direct_navigation"
    ) {
      return false;
    }
    if (youTubeNavigation.youtube_visit_metadata.reach_type === "page_reload") {
      return false;
    }
    const parentUrlType = this.parentUrlTypeFromYouTubeNavigation(
      youTubeNavigation,
    );
    if (parentUrlType === "search_results_page") {
      if (
        ["search_results_page_for_you_videos_click"].includes(
          youTubeNavigation.youtube_visit_metadata.reach_type,
        )
      ) {
        return false;
      } else {
        return true;
      }
    }
    if (
      [
        "watch_page",
        "user_page",
        "channel_page",
        "youtube_main_page",
        "not_a_youtube_page",
      ].includes(parentUrlType)
    ) {
      return false;
    }
    return null;
  }

  viaNonSearchAlgorithmicRecommendationsContentFromYouTubeNavigation(
    youTubeNavigation: YouTubeNavigation,
  ): boolean | FailedBooleanAttribute {
    if (youTubeNavigation.youtube_visit_metadata.url_type !== "watch_page") {
      return null;
    }
    if (
      youTubeNavigation.youtube_visit_metadata.reach_type ===
      "direct_navigation"
    ) {
      return false;
    }
    if (youTubeNavigation.youtube_visit_metadata.reach_type === "page_reload") {
      return false;
    }
    const parentUrlType = this.parentUrlTypeFromYouTubeNavigation(
      youTubeNavigation,
    );
    if (parentUrlType === "search_results_page") {
      if (
        ["search_results_page_for_you_videos_click"].includes(
          youTubeNavigation.youtube_visit_metadata.reach_type,
        )
      ) {
        return true;
      } else {
        return false;
      }
    }
    if (
      ["watch_page", "user_page", "channel_page", "youtube_main_page"].includes(
        parentUrlType,
      )
    ) {
      return true;
    }
    if (["not_a_youtube_page"].includes(parentUrlType)) {
      return false;
    }
    return null;
  }

  viaRecommendationsWithAnExplicitQueryOrConstraintToOptimizeForFromYouTubeNavigation(
    youTubeNavigation: YouTubeNavigation,
  ): boolean | FailedBooleanAttribute {
    if (youTubeNavigation.youtube_visit_metadata.url_type !== "watch_page") {
      return null;
    }
    const parentUrlType = this.parentUrlTypeFromYouTubeNavigation(
      youTubeNavigation,
    );
    if (parentUrlType === "user_page") {
      return true;
    }
    if (parentUrlType === "channel_page") {
      return true;
    }
    return this.viaSearchResultsFromYouTubeNavigation(youTubeNavigation);
  }

  async youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
    youTubeNavigations: YouTubeNavigation[],
    windowId,
    tabId,
    skipWindowAndTabIdFilter = false,
  ): Promise<YouTubeNavigationSpecificRegretReportData> {
    if (youTubeNavigations.length === 0) {
      throw new Error("No YouTube navigations captured yet");
    }
    const matchingYouTubeNavigations = youTubeNavigations.filter(
      youTubeNavigation =>
        youTubeNavigation.window_id === windowId &&
        youTubeNavigation.tab_id === tabId,
    );
    // Allows for the report form to be displayed in a separate tab for debugging purposes
    if (skipWindowAndTabIdFilter) {
      matchingYouTubeNavigations.push(...youTubeNavigations);
    }
    const mostRecentYouTubeNavigation = matchingYouTubeNavigations
      .slice()
      .pop();
    if (!mostRecentYouTubeNavigation) {
      throw new Error(
        `No YouTube navigations matching window id ${windowId}, tab id ${tabId} captured yet`,
      );
    }
    // console.log({ youTubeNavigations, mostRecentYouTubeNavigation });
    const reportMetadata = this.youTubeNavigationMetadataFromYouTubeNavigation(
      mostRecentYouTubeNavigation,
    );
    const parent_youtube_navigations_metadata = mostRecentYouTubeNavigation.parent_youtube_navigations.map(
      this.youTubeNavigationMetadataFromYouTubeNavigation,
    );
    return {
      youtube_navigation_metadata: reportMetadata,
      parent_youtube_navigations_metadata,
    };
  }
}

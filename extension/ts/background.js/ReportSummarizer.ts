import {
  NavigationBatch,
  OpenWpmPayloadEnvelope,
  TrimmedNavigationBatch,
} from "./NavigationBatchPreprocessor";
import { OpenWPMObjectifiedEventTarget } from "@openwpm/webext-instrumentation";
import {
  classifyYouTubeNavigationUrlType,
  YouTubeNavigationUrlType,
} from "./lib/youTubeNavigationUrlType";
import { YouTubeUsageStatisticsUpdate } from "./YouTubeUsageStatistics";

type YouTubeNavigationLinkPosition =
  | "search_results"
  | "search_page_for_you_recommendations"
  | "watch_next_column"
  | "watch_next_end_screen";
// | "up_next_auto_play"

export type YouTubeNavigationReachType =
  | YouTubeNavigationLinkPosition
  | "search_action"
  | "direct_navigation"
  | "page_reload"
  | "clicked_link"
  | "unspecified_navigation"
  | "from_watch_page_without_clicking_at_all"
  | "from_watch_page_without_clicking_neither_up_next_nor_end_screen"
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
  [position in YouTubeNavigationLinkPosition]?:
    | string[]
    | FailedStringAttribute;
};

export interface YoutubePageMetadata {
  video_metadata: VideoMetadata;
  outgoing_video_ids_by_category: OutgoingVideoIdsByCategory;
}

export interface YoutubeVisitMetadata {
  reach_type: YouTubeNavigationReachType;
  url_type: YouTubeNavigationUrlType;
  referrer_url_type: YouTubeNavigationUrlType;
}

export interface YouTubeNavigation {
  video_metadata?: VideoMetadata;
  outgoing_video_ids_by_category?: OutgoingVideoIdsByCategory;
  tab_active_dwell_time_at_navigation: number | FailedIntegerAttribute;
  url: undefined | string | FailedStringAttribute;
  referrer_url: undefined | string | FailedStringAttribute;
  parent_youtube_navigations: YouTubeNavigation[];
  youtube_visit_metadata: YoutubeVisitMetadata;
  time_stamp: string;
  window_id: number;
  tab_id: number;
  frame_id: number;
  event_ordinal: number;
}

export interface YouTubeNavigationSpecificRegretReportData {
  video_metadata: VideoMetadata;
  how_the_video_was_reached: YoutubeVisitMetadata[];
}

export interface RegretReportData
  extends YouTubeNavigationSpecificRegretReportData {
  youtube_usage_statistics_update: YouTubeUsageStatisticsUpdate;
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
      trimmedUserInteractionCount: -1,
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

    const clickEventEnvelopes = topFrameNavigationBatch.childEnvelopes.filter(
      childEnvelope =>
        childEnvelope.type === "user_interactions" &&
        childEnvelope.userInteraction.frame_id === 0,
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
      const referrer_url = httpRequestEnvelope.httpRequest.referrer;
      const url_type = classifyYouTubeNavigationUrlType(url);
      const referrer_url_type = classifyYouTubeNavigationUrlType(referrer_url);
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
      let youtubePageMetadata: YoutubePageMetadata = {
        video_metadata: undefined,
        outgoing_video_ids_by_category: {},
      };
      if (capturedContentEnvelope) {
        // Check what kind of page was visited and run the appropriate extraction methods
        if (url_type === "watch_page") {
          youtubePageMetadata = this.extractYoutubePageMetadataFromCapturedWatchPageContent(
            httpRequestEnvelope,
            capturedContentEnvelope,
          );
        } else if (url_type === "search_results_page") {
          youtubePageMetadata = this.extractYoutubePageMetadataFromCapturedSearchResultsPageContent(
            httpRequestEnvelope,
            capturedContentEnvelope,
          );
        } else {
          console.warn("No video metadata is extracted for this url type", {
            url,
            url_type,
          });
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
        parent_youtube_navigations = youTubeNavigations.slice(0, 5).reverse();
        parentYouTubeNavigation = parent_youtube_navigations.slice().shift();
      } else {
        // TODO: Only consider those within the same tab
        parent_youtube_navigations = youTubeNavigations.slice(0, 5).reverse();
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
            childEnvelope.userInteraction.event_ordinal >
              firstRelevantEventOrdinal &&
            childEnvelope.userInteraction.event_ordinal <
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
        } else {
          reach_type = "unspecified_navigation";
          console.warn("No reach type is extracted for this url type", {
            url: parentYouTubeNavigation.url,
            url_type: parentYouTubeNavigationUrlType,
          });
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
          referrer_url_type,
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

  extractYoutubePageMetadataFromCapturedWatchPageContent(
    httpRequestEnvelope: OpenWpmPayloadEnvelope,
    capturedContentEnvelope: OpenWpmPayloadEnvelope,
  ): YoutubePageMetadata {
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
      console.error("watch_next_column unhandled el:");
      console.dir({ el });
    };

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
        // up_next_auto_play,
        watch_next_column,
        watch_next_end_screen,
      },
    };
  }

  extractYoutubePageMetadataFromCapturedSearchResultsPageContent(
    httpRequestEnvelope: OpenWpmPayloadEnvelope,
    capturedContentEnvelope: OpenWpmPayloadEnvelope,
  ): YoutubePageMetadata {
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

  extractReachTypeFromWatchPageData(
    clickEventEnvelopesForParentYouTubeNavigation: OpenWpmPayloadEnvelope[],
    parentYouTubeNavigation: YouTubeNavigation,
    youtubePageMetadata: YoutubePageMetadata,
    url_type: YouTubeNavigationUrlType,
  ): YouTubeNavigationReachType {
    let clickedWithinRelated = false;
    let clickedEndScreenUpNextAutoplayButton = false;
    let clickedEndScreenCancelUpNextAutoplayButton = false;
    clickEventEnvelopesForParentYouTubeNavigation.map(clickEventEnvelope => {
      const composedPath = JSON.parse(
        clickEventEnvelope.userInteraction.composed_path,
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
      return "from_watch_page_without_clicking_at_all";
    } else if (
      !clickedWithinRelated &&
      !clickedEndScreenUpNextAutoplayButton &&
      !clickedEndScreenCancelUpNextAutoplayButton
    ) {
      return "from_watch_page_without_clicking_neither_up_next_nor_end_screen";
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
      if (
        url_type === "watch_page" &&
        clickedWithinRelated &&
        parentWatchNextColumnIncludesThisVideoId
      ) {
        return "watch_next_column";
      }

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
      if (
        url_type === "watch_page" &&
        clickedEndScreenUpNextAutoplayButton &&
        parentWatchNextEndScreenIncludesThisVideoId
      ) {
        return "watch_next_end_screen";
      }
    }
    return "<failed>";
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
    const how_the_video_was_reached = [
      mostRecentYouTubeNavigation.youtube_visit_metadata,
    ];
    how_the_video_was_reached.push(
      ...mostRecentYouTubeNavigation.parent_youtube_navigations.map(
        pyn => pyn.youtube_visit_metadata,
      ),
    );
    return {
      video_metadata: mostRecentYouTubeNavigation.video_metadata,
      how_the_video_was_reached,
    };
  }
}

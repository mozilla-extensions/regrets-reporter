import {
  NavigationBatch,
  OpenWpmPayloadEnvelope,
  TrimmedNavigationBatch,
  TrimmedNavigationBatchesByUuid,
} from "./NavigationBatchPreprocessor";
import { OpenWPMObjectifiedEventTarget } from "../shared-resources/openwpm-webext-instrumentation";
import {
  classifyYouTubeNavigationUrlType,
  YouTubeNavigationUrlType,
} from "./lib/youTubeNavigationUrlType";
import { YouTubeUsageStatisticsUpdate } from "./YouTubeUsageStatistics";
import {
  captureExceptionWithExtras,
  Sentry,
} from "../shared-resources/ErrorReporting";

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

class UnexpectedContentParseError extends Error {
  public errorReportContext: any;
  constructor(errorReportContext, ...params) {
    super(...params);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnexpectedContentParseError);
    }
    this.name = "UnexpectedContentParseError";
    this.errorReportContext = errorReportContext;
  }
}

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
  video_element_play_time: number;
  document_visible_time: number;
}

export interface YouTubeNavigation {
  video_metadata?: VideoMetadata;
  outgoing_video_ids_by_category?: OutgoingVideoIdsByCategory;
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

/**
 * Selected/derived attributes from YouTubeNavigations
 */
export interface YouTubeNavigationMetadata {
  video_metadata?: VideoMetadata;
  url_type: YouTubeNavigationUrlType;
  page_entry_point: YouTubePageEntryPoint;
  via_search_results: number | FailedIntegerAttribute;
  via_non_search_algorithmic_recommendations_content:
    | number
    | FailedIntegerAttribute;
  via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for:
    | number
    | FailedIntegerAttribute;
  video_element_play_time: number;
  document_visible_time: number;
}

export interface YouTubeNavigationSpecificRegretReportData {
  youtube_navigation_metadata: YouTubeNavigationMetadata;
  parent_youtube_navigations_metadata: YouTubeNavigationMetadata[];
}

export interface RegretReportData
  extends YouTubeNavigationSpecificRegretReportData {
  youtube_usage_statistics_update: YouTubeUsageStatisticsUpdate;
  report_data_uuid: string;
}

export interface RegretReport {
  report_data: RegretReportData;
  user_supplied_regret_categories: string[];
  user_supplied_other_regret_category: string;
  user_supplied_severity: number;
  user_supplied_optional_comment: string;
  form_step: number;
}

export class ReportSummarizer {
  public matchYtInitialData = /var\sytInitialData\s*=\s*(.*);\s?<\/script>/;
  public matchYtInitialDataPre202008 = /window\["ytInitialData"\]\s*=\s*(.*);\s*window\["ytInitialPlayerResponse"\]/;

  trimNavigationBatch(
    navigationBatch: NavigationBatch | TrimmedNavigationBatch,
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
    if (navigationBatch.capturedContentCount > 0) {
      trimmedNavigationBatch.trimmedCapturedContentCount = 0;
      trimmedNavigationBatch.childEnvelopes = navigationBatch.childEnvelopes.map(
        envelope => {
          // If a captured content matches one of the ytInitialData regexes, we save only the matching string
          // Note: This strategy fails if for some reasons a XHR request or similar would contain raw text that
          // makes the regex match, but that seems unlikely
          if (
            envelope.type === "openwpm_captured_content" &&
            envelope.capturedContent.decoded_content
          ) {
            const matches = envelope.capturedContent.decoded_content.match(
              this.matchYtInitialData,
            );
            if (matches && matches[0]) {
              envelope.capturedContent.decoded_content = matches[0];
              trimmedNavigationBatch.trimmedCapturedContentCount++;
            } else {
              const matches = envelope.capturedContent.decoded_content.match(
                this.matchYtInitialDataPre202008,
              );
              if (matches && matches[0]) {
                envelope.capturedContent.decoded_content = matches[0];
                trimmedNavigationBatch.trimmedCapturedContentCount++;
              }
            }
          }
          return envelope;
        },
      );
    }

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
        childEnvelope.type === "ui_interactions" &&
        childEnvelope.uiInteraction.frame_id === 0,
    );

    const uiStateEnvelopes = topFrameNavigationBatch.childEnvelopes.filter(
      childEnvelope =>
        childEnvelope.type === "ui_states" &&
        childEnvelope.uiState.frame_id === 0,
    );

    let i = -1;
    for (const currentHttpResponseEnvelope of topFrameHttpResponseEnvelopes) {
      i = i + 1;
      // console.log({ currentHttpResponseEnvelope });
      const nextHttpResponseEnvelope =
        topFrameHttpResponseEnvelopes[i + 1] || false;

      // The corresponding http request(s)
      const httpRequestEnvelopeMatcher = childEnvelope =>
        childEnvelope.type === "http_requests" &&
        childEnvelope.httpRequest.request_id ===
          currentHttpResponseEnvelope.httpResponse.request_id;

      const httpRequestEnvelope = topFrameNavigationBatch.childEnvelopes
        .slice()
        .reverse()
        .find(httpRequestEnvelopeMatcher);
      // console.log({ httpRequestEnvelope });

      if (!httpRequestEnvelope) {
        // Ignore this http response and continue with the rest
        continue;
      }

      // ... and the corresponding captured content
      const capturedContentEnvelope = topFrameNavigationBatch.childEnvelopes.find(
        childEnvelope =>
          childEnvelope.type === "openwpm_captured_content" &&
          childEnvelope.capturedContent.frame_id === 0 &&
          childEnvelope.capturedContent.content_hash ===
            currentHttpResponseEnvelope.httpResponse.content_hash,
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

      // event ordinals relevant to slicing the click and ui state events by http response / youtube navigation
      const currentHttpResponseEventOrdinal =
        currentHttpResponseEnvelope.httpResponse.event_ordinal;
      const nextHttpResponseEventOrdinal = nextHttpResponseEnvelope
        ? nextHttpResponseEnvelope.httpResponse.event_ordinal
        : Number.MAX_SAFE_INTEGER;

      // console.log({currentHttpResponseEventOrdinal, nextHttpResponseEventOrdinal});

      // ui states for the current youtube navigation
      const uiStateEnvelopesForCurrentYouTubeNavigation = uiStateEnvelopes.filter(
        childEnvelope =>
          childEnvelope.uiState.event_ordinal >
            currentHttpResponseEventOrdinal &&
          childEnvelope.uiState.event_ordinal < nextHttpResponseEventOrdinal,
      );
      // console.dir({ uiStateEnvelopesForCurrentYouTubeNavigation }, { depth: 5 });

      const video_element_play_time = uiStateEnvelopesForCurrentYouTubeNavigation
        .map(uiStateEnvelope =>
          uiStateEnvelope.uiState.video_element_is_playing === 1
            ? uiStateEnvelope.uiState.interval_ms
            : 0,
        )
        .reduce((a, b) => a + b, 0);

      const document_visible_time = uiStateEnvelopesForCurrentYouTubeNavigation
        .map(uiStateEnvelope =>
          uiStateEnvelope.uiState.document_hidden === 0
            ? uiStateEnvelope.uiState.interval_ms
            : 0,
        )
        .reduce((a, b) => a + b, 0);

      // Extract page metadata from the captured content if available
      let youtubePageMetadata: YouTubePageMetadata = {
        video_metadata: undefined,
        outgoing_video_ids_by_category: {},
      };
      if (capturedContentEnvelope) {
        try {
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
        } catch (error) {
          if (error.name === "UnexpectedContentParseError") {
            // report it
            captureExceptionWithExtras(
              error,
              error.errorReportContext,
              Sentry.Severity.Warning,
            );
            console.error(error.message, {
              errorReportContext: error.errorReportContext,
            });
            // try the next one instead
            continue;
          }
          // else throw the error
          throw error;
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
        // console.dir({ uiStateEnvelopes }, { depth: 5 });

        // event ordinal relevant to slicing the click events by http response / youtube navigation
        const parentYouTubeNavigationEventOrdinal =
          parentYouTubeNavigation.event_ordinal;

        // console.log({ parentYouTubeNavigationEventOrdinal });

        // click events leading up to the subsequent youtube navigation
        const clickEventEnvelopesForParentYouTubeNavigation = clickEventEnvelopes.filter(
          childEnvelope =>
            childEnvelope.uiInteraction.event_ordinal >
              parentYouTubeNavigationEventOrdinal &&
            childEnvelope.uiInteraction.event_ordinal <
              currentHttpResponseEventOrdinal,
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
        url,
        referrer_url,
        parent_youtube_navigations,
        youtube_visit_metadata: {
          url_type,
          reach_type,
          video_element_play_time,
          document_visible_time,
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
      };
      youTubeNavigations.push(youTubeNavigation);
    }
    return youTubeNavigations;
  }

  extractYtInitialDataFromYouTubeResponseBody = (
    httpRequestEnvelope: OpenWpmPayloadEnvelope,
    capturedContentEnvelope: OpenWpmPayloadEnvelope,
  ) => {
    let ytInitialData;

    if (httpRequestEnvelope.httpRequest.is_XHR == 0) {
      // Handle ordinary full page loads
      const htmlContent =
        capturedContentEnvelope.capturedContent.decoded_content;
      let matchArray;
      // Most recently know style of markup
      matchArray = htmlContent.match(this.matchYtInitialData);
      if (!matchArray) {
        // Older style of markup
        matchArray = htmlContent.match(this.matchYtInitialDataPre202008);
        if (!matchArray) {
          console.dir(
            { httpRequestEnvelope, capturedContentEnvelope, matchArray },
            { depth: 4 },
          );
          throw new UnexpectedContentParseError(
            { matchArray },
            "No match of ytInitialData in htmlContent",
          );
        }
      }
      ytInitialData = JSON.parse(matchArray[1]);
    } else {
      // Handle subsequent pushState-based loads
      const jsonContent =
        capturedContentEnvelope.capturedContent.decoded_content;
      const xhrResponse = JSON.parse(jsonContent);
      if (typeof xhrResponse.find === "function") {
        const xhrResponseItemWithYtInitialData = xhrResponse.find(
          xhrResponseItem => {
            return xhrResponseItem.response !== undefined;
          },
        );
        if (!xhrResponseItemWithYtInitialData) {
          console.dir(
            { httpRequestEnvelope, capturedContentEnvelope, jsonContent, xhrResponse },
            { depth: 4 },
          );
          throw new UnexpectedContentParseError(
            {},
            "No xhrResponseItemWithYtInitialData",
          );
        }
        ytInitialData = xhrResponseItemWithYtInitialData.response;
      } else if (typeof xhrResponse === "object") {
        ytInitialData = xhrResponse;
      } else {
        console.dir(
          { httpRequestEnvelope, capturedContentEnvelope, jsonContent, xhrResponse },
          { depth: 4 },
        );
        throw new UnexpectedContentParseError(
          {},
          "Unexpected xhr response format",
        );
      }
    }

    // console.dir({ ytInitialData }, {depth: 5});

    if (!ytInitialData) {
      console.dir(
        { httpRequestEnvelope, capturedContentEnvelope },
        { depth: 4 },
      );
      throw new UnexpectedContentParseError({}, "ytInitialData is empty");
    }

    return ytInitialData;
  };

  extractYouTubePageMetadataFromCapturedWatchPageContent = (
    httpRequestEnvelope: OpenWpmPayloadEnvelope,
    capturedContentEnvelope: OpenWpmPayloadEnvelope,
  ): YouTubePageMetadata => {
    const ytInitialData = this.extractYtInitialDataFromYouTubeResponseBody(
      httpRequestEnvelope,
      capturedContentEnvelope,
    );
    let errorContext;
    let video_id;
    try {
      if (!ytInitialData.currentVideoEndpoint) {
        // this has been detected in error reports and further information is necessary to understand the context
        errorContext = {
          ytInitialDataObjectKeys: Object.keys(ytInitialData),
        };
      }
      video_id = ytInitialData.currentVideoEndpoint.watchEndpoint.videoId;
    } catch (err) {
      captureExceptionWithExtras(
        err,
        { attribute: "video_id", ...errorContext },
        Sentry.Severity.Warning,
      );
      console.error("video_id", err.message);
      // console.dir({ ytInitialData }, {depth: 5});
      video_id = "<failed>";
    }

    let video_title;
    let video_posting_date;
    let view_count_at_navigation_short;
    let view_count_at_navigation;

    interface YouTubeRun {
      text: string;
      navigationEndpoint?: {
        urlEndpoint?: { url: string };
        commandMetadata?: { webCommandMetadata: { url: string } };
      };
    }

    const runsToMarkdown = (runs: YouTubeRun[]) => {
      return runs
        .map((run: YouTubeRun) => {
          if (run.navigationEndpoint) {
            if (run.navigationEndpoint.urlEndpoint) {
              return `[${run.text}](${run.navigationEndpoint.urlEndpoint.url})`;
            } else if (
              run.navigationEndpoint.commandMetadata &&
              run.navigationEndpoint.commandMetadata.webCommandMetadata
            ) {
              return `[${run.text}](${run.navigationEndpoint.commandMetadata.webCommandMetadata.url})`;
            } else {
              console.debug("Unexpected YouTube runs structure encountered", {
                run,
              });
              captureExceptionWithExtras(
                new Error("Unexpected YouTube runs structure encountered"),
                { run },
                Sentry.Severity.Warning,
              );
              return run.text;
            }
          }
          return run.text;
        })
        .join("");
    };

    try {
      const twoColumnWatchNextResultsResultsResultsContentsWithVideoPrimaryInfoRenderer = ytInitialData.contents.twoColumnWatchNextResults.results.results.contents.find(
        contents => {
          return contents.videoPrimaryInfoRenderer !== undefined;
        },
      );

      try {
        video_title = runsToMarkdown(
          twoColumnWatchNextResultsResultsResultsContentsWithVideoPrimaryInfoRenderer
            .videoPrimaryInfoRenderer.title.runs,
        );
      } catch (err) {
        captureExceptionWithExtras(
          err,
          { attribute: "video_title" },
          Sentry.Severity.Warning,
        );
        console.error("video_title", err.message);
        video_title = "<failed>";
      }

      try {
        video_posting_date =
          twoColumnWatchNextResultsResultsResultsContentsWithVideoPrimaryInfoRenderer
            .videoPrimaryInfoRenderer.dateText.simpleText;
      } catch (err) {
        captureExceptionWithExtras(
          err,
          { attribute: "video_posting_date" },
          Sentry.Severity.Warning,
        );
        console.error("video_posting_date", err.message);
        video_posting_date = "";
      }

      try {
        if (
          !twoColumnWatchNextResultsResultsResultsContentsWithVideoPrimaryInfoRenderer
            .videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer.viewCount
            .simpleText
        ) {
          // this has been detected in error reports and further information is necessary to understand the context
          errorContext = {
            viewCountObjectKeys: Object.keys(
              twoColumnWatchNextResultsResultsResultsContentsWithVideoPrimaryInfoRenderer
                .videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer
                .viewCount,
            ),
          };
        }
        view_count_at_navigation = parseInt(
          twoColumnWatchNextResultsResultsResultsContentsWithVideoPrimaryInfoRenderer.videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer.viewCount.simpleText.replace(
            /\D/g,
            "",
          ),
          10,
        );
      } catch (err) {
        captureExceptionWithExtras(
          err,
          {
            attribute: "view_count_at_navigation",
            ...errorContext,
          },
          Sentry.Severity.Warning,
        );
        console.error("view_count_at_navigation", err.message);
        view_count_at_navigation = -1;
      }

      try {
        if (
          !twoColumnWatchNextResultsResultsResultsContentsWithVideoPrimaryInfoRenderer
            .videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer
            .shortViewCount
        ) {
          // this has been detected in error reports and further information is necessary to understand the context
          errorContext = {
            videoViewCountRendererObjectKeys: Object.keys(
              twoColumnWatchNextResultsResultsResultsContentsWithVideoPrimaryInfoRenderer
                .videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer,
            ),
          };
        }
        view_count_at_navigation_short =
          twoColumnWatchNextResultsResultsResultsContentsWithVideoPrimaryInfoRenderer
            .videoPrimaryInfoRenderer.viewCount.videoViewCountRenderer
            .shortViewCount.simpleText;
      } catch (err) {
        captureExceptionWithExtras(
          err,
          {
            attribute: "view_count_at_navigation_short",
            ...errorContext,
          },
          Sentry.Severity.Warning,
        );
        console.error("view_count_at_navigation_short", err.message);
        view_count_at_navigation_short = "<failed>";
      }
    } catch (err) {
      captureExceptionWithExtras(
        err,
        {
          attribute: "video_* within videoPrimaryInfoRenderer",
        },
        Sentry.Severity.Warning,
      );
      console.error("video_* within videoPrimaryInfoRenderer", err.message);
      video_title = "<failed>";
    }

    let video_description;
    try {
      if (!ytInitialData.contents) {
        // this has been detected in error reports and further information is necessary to understand the context
        errorContext = {
          ytInitialDataObjectKeys: Object.keys(ytInitialData),
        };
      } else {
        if (
          !ytInitialData.contents.twoColumnWatchNextResults.results.results
            .contents
        ) {
          // this has been detected in error reports and further information is necessary to understand the context
          errorContext = {
            resultsResultsObjectKeys: Object.keys(
              ytInitialData.contents.twoColumnWatchNextResults.results.results,
            ),
          };
        }
      }
      const twoColumnWatchNextResultsResultsResultsContentsWithVideoSecondaryInfoRenderer = ytInitialData.contents.twoColumnWatchNextResults.results.results.contents.find(
        contents => {
          return contents.videoSecondaryInfoRenderer !== undefined;
        },
      );
      const {
        description,
      } = twoColumnWatchNextResultsResultsResultsContentsWithVideoSecondaryInfoRenderer.videoSecondaryInfoRenderer;
      if (description) {
        video_description = runsToMarkdown(description.runs);
      } else {
        // Some videos don't have descriptions
        video_description = "";
      }
    } catch (err) {
      captureExceptionWithExtras(
        err,
        {
          attribute: "video_description",
          ...errorContext,
        },
        Sentry.Severity.Warning,
      );
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
  };

  extractYouTubePageMetadataFromCapturedSearchResultsPageContent(
    httpRequestEnvelope: OpenWpmPayloadEnvelope,
    capturedContentEnvelope: OpenWpmPayloadEnvelope,
  ): YouTubePageMetadata {
    const ytInitialData = this.extractYtInitialDataFromYouTubeResponseBody(
      httpRequestEnvelope,
      capturedContentEnvelope,
    );
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
          if (el.playlistRenderer) {
            return el.playlistRenderer.navigationEndpoint.watchEndpoint.videoId;
          }
          if (el.radioRenderer) {
            return el.radioRenderer.navigationEndpoint.watchEndpoint.videoId;
          }
          // Assume shelf-rendered items are not direct search results
          if (el.shelfRenderer) {
            try {
              const video_ids = el.shelfRenderer.content.verticalListRenderer.items.map(
                el => {
                  if (el.videoRenderer) {
                    return el.videoRenderer.videoId;
                  }
                  captureExceptionWithExtras(
                    new Error(
                      "search_results_page_other_indirect_videos unhandled el",
                    ),
                    { elObjectKeys: Object.keys(el) },
                    Sentry.Severity.Warning,
                  );
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
          const elObjectKeys = Object.keys(el);
          const firstRendererElObjectKey = elObjectKeys.find(
            (elObjectKey: string) => elObjectKey.indexOf("Renderer") > -1,
          );
          if (firstRendererElObjectKey) {
            return `(${firstRendererElObjectKey})`;
          }
          captureExceptionWithExtras(
            new Error("search_results unhandled el"),
            {
              el,
            },
            Sentry.Severity.Warning,
          );
          console.error("search_results unhandled el:");
          console.dir({ el }, { depth: 4 });
        },
      );
    } catch (err) {
      captureExceptionWithExtras(err, null, Sentry.Severity.Warning);
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

    // console.log({url_type, clickedWithinSearchResults, clickedWithinSearchPageNotSearchResults,});

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

      if (clickedWithinSearchResults) {
        if (url_type === "watch_page") {
          return "search_results_video_click";
        } else {
          return "search_results_non_video_click";
        }
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
      video_element_play_time:
        youTubeNavigation.youtube_visit_metadata.video_element_play_time,
      document_visible_time:
        youTubeNavigation.youtube_visit_metadata.document_visible_time,
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
  ): number | FailedIntegerAttribute {
    if (
      youTubeNavigation.youtube_visit_metadata.reach_type ===
      "direct_navigation"
    ) {
      return 0;
    }
    if (youTubeNavigation.youtube_visit_metadata.reach_type === "page_reload") {
      return 0;
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
        return 0;
      } else {
        return 1;
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
      return 0;
    }
    return -1;
  }

  viaNonSearchAlgorithmicRecommendationsContentFromYouTubeNavigation(
    youTubeNavigation: YouTubeNavigation,
  ): number | FailedIntegerAttribute {
    if (youTubeNavigation.youtube_visit_metadata.url_type !== "watch_page") {
      return -1;
    }
    if (
      youTubeNavigation.youtube_visit_metadata.reach_type ===
      "direct_navigation"
    ) {
      return 0;
    }
    if (youTubeNavigation.youtube_visit_metadata.reach_type === "page_reload") {
      return 0;
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
        return 1;
      } else {
        return 0;
      }
    }
    if (
      ["watch_page", "user_page", "channel_page", "youtube_main_page"].includes(
        parentUrlType,
      )
    ) {
      return 1;
    }
    if (["not_a_youtube_page"].includes(parentUrlType)) {
      return 0;
    }
    return -1;
  }

  viaRecommendationsWithAnExplicitQueryOrConstraintToOptimizeForFromYouTubeNavigation(
    youTubeNavigation: YouTubeNavigation,
  ): number | FailedIntegerAttribute {
    if (youTubeNavigation.youtube_visit_metadata.url_type !== "watch_page") {
      return -1;
    }
    const parentUrlType = this.parentUrlTypeFromYouTubeNavigation(
      youTubeNavigation,
    );
    if (parentUrlType === "user_page") {
      return 1;
    }
    if (parentUrlType === "channel_page") {
      return 1;
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
      throw new Error(
        "No YouTube navigations captured yet (or they have expired)",
      );
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
      console.debug({ windowId, tabId });
      throw new Error(
        `No YouTube navigations matching the specific window and tab id captured yet (or they have expired)`,
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

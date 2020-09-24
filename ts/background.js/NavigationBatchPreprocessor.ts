import {
  HttpRedirect,
  HttpRequest,
  HttpResponse,
  JavascriptCookieRecord,
  JavascriptOperation,
  Navigation,
  UiInteraction,
  UiState,
} from "../shared-resources/openwpm-webext-instrumentation";
import { CapturedContent, LogEntry } from "./openWpmPacketHandler";
import { isoDateTimeStringsWithinFutureSecondThreshold } from "./lib/dateUtils";
import {
  captureExceptionWithExtras,
  Sentry,
} from "../shared-resources/ErrorReporting";
import { browser } from "webextension-polyfill-ts";

export interface NavigationBatch {
  navigationEnvelope: OpenWpmPayloadEnvelope;
  childEnvelopes: OpenWpmPayloadEnvelope[];
  httpRequestCount: number;
  httpResponseCount: number;
  httpRedirectCount: number;
  javascriptOperationCount: number;
  capturedContentCount: number;
  uiInteractionCount: number;
  uiStateCount: number;
}

export interface TrimmedNavigationBatch extends NavigationBatch {
  trimmedHttpRequestCount: number;
  trimmedHttpResponseCount: number;
  trimmedHttpRedirectCount: number;
  trimmedJavascriptOperationCount: number;
  trimmedCapturedContentCount: number;
  trimmedUiInteractionCount: number;
  trimmedUiStateCount: number;
}

export interface TrimmedNavigationBatchesByUuid {
  [navigationUuid: string]: TrimmedNavigationBatch;
}

export type OpenWPMType =
  | "navigations"
  | "navigation_batches"
  | "trimmed_navigation_batches"
  | "http_requests"
  | "http_responses"
  | "http_redirects"
  | "javascript"
  | "javascript_cookies"
  | "openwpm_log"
  | "openwpm_captured_content"
  | "ui_interactions"
  | "ui_states";

type OpenWPMPayload =
  | Navigation
  | NavigationBatch
  | TrimmedNavigationBatch
  | HttpRequest
  | HttpResponse
  | HttpRedirect
  | JavascriptOperation
  | JavascriptCookieRecord
  | LogEntry
  | CapturedContent
  | UiInteraction
  | UiState;

type BatchableChildOpenWPMPayload =
  | HttpRequest
  | HttpResponse
  | HttpRedirect
  | JavascriptOperation
  | CapturedContent
  | UiInteraction
  | UiState;

/**
 * An envelope that allows for grouping of different
 * types of OpenWPM packets together while maintaining
 * type checking
 */
export interface OpenWpmPayloadEnvelope {
  type: OpenWPMType;
  navigation?: Navigation;
  navigationBatch?: NavigationBatch;
  trimmedNavigationBatch?: TrimmedNavigationBatch;
  httpRequest?: HttpRequest;
  httpResponse?: HttpResponse;
  httpRedirect?: HttpRedirect;
  javascriptOperation?: JavascriptOperation;
  javascriptCookieRecord?: JavascriptCookieRecord;
  logEntry?: LogEntry;
  capturedContent?: CapturedContent;
  uiInteraction?: UiInteraction;
  uiState?: UiState;
}

export const batchableChildOpenWpmPayloadFromOpenWpmPayloadEnvelope = (
  openWpmPayloadEnvelope: OpenWpmPayloadEnvelope,
): BatchableChildOpenWPMPayload => {
  switch (openWpmPayloadEnvelope.type) {
    case "http_requests":
      return openWpmPayloadEnvelope.httpRequest as HttpRequest;
    case "http_responses":
      return openWpmPayloadEnvelope.httpResponse as HttpResponse;
    case "http_redirects":
      return openWpmPayloadEnvelope.httpRedirect as HttpRedirect;
    case "javascript":
      return openWpmPayloadEnvelope.javascriptOperation as JavascriptOperation;
    case "openwpm_captured_content":
      return openWpmPayloadEnvelope.capturedContent as CapturedContent;
    case "ui_interactions":
      return openWpmPayloadEnvelope.uiInteraction as UiInteraction;
    case "ui_states":
      return openWpmPayloadEnvelope.uiState as UiState;
  }
  throw new Error(`Unexpected type supplied: '${openWpmPayloadEnvelope.type}'`);
};

export const openWpmPayloadEnvelopeFromOpenWpmTypeAndPayload = (
  type: OpenWPMType,
  payload: OpenWPMPayload,
): OpenWpmPayloadEnvelope => {
  const openWpmPayloadEnvelope: OpenWpmPayloadEnvelope = {
    type,
    navigation: type === "navigations" ? (payload as Navigation) : undefined,
    navigationBatch:
      type === "navigation_batches" ? (payload as NavigationBatch) : undefined,
    trimmedNavigationBatch:
      type === "trimmed_navigation_batches"
        ? (payload as TrimmedNavigationBatch)
        : undefined,
    httpRequest:
      type === "http_requests" ? (payload as HttpRequest) : undefined,
    httpResponse:
      type === "http_responses" ? (payload as HttpResponse) : undefined,
    httpRedirect:
      type === "http_redirects" ? (payload as HttpRedirect) : undefined,
    javascriptOperation:
      type === "javascript" ? (payload as JavascriptOperation) : undefined,
    javascriptCookieRecord:
      type === "javascript_cookies"
        ? (payload as JavascriptCookieRecord)
        : undefined,
    logEntry: type === "openwpm_log" ? (payload as LogEntry) : undefined,
    capturedContent:
      type === "openwpm_captured_content"
        ? (payload as CapturedContent)
        : undefined,
    uiInteraction:
      type === "ui_interactions" ? (payload as UiInteraction) : undefined,
    uiState: type === "ui_states" ? (payload as UiState) : undefined,
  };
  return openWpmPayloadEnvelope;
};

const removeItemFromArray = (ar, el) => {
  ar.splice(ar.indexOf(el), 1);
};

const setEnvelopeCounts = $navigationBatch => {
  $navigationBatch.httpRequestCount = $navigationBatch.childEnvelopes.filter(
    env => env.type === "http_requests",
  ).length;
  $navigationBatch.httpResponseCount = $navigationBatch.childEnvelopes.filter(
    env => env.type === "http_responses",
  ).length;
  $navigationBatch.httpRedirectCount = $navigationBatch.childEnvelopes.filter(
    env => env.type === "http_redirects",
  ).length;
  $navigationBatch.javascriptOperationCount = $navigationBatch.childEnvelopes.filter(
    env => env.type === "javascript",
  ).length;
  $navigationBatch.capturedContentCount = $navigationBatch.childEnvelopes.filter(
    env => env.type === "openwpm_captured_content",
  ).length;
  $navigationBatch.uiInteractionCount = $navigationBatch.childEnvelopes.filter(
    env => env.type === "ui_interactions",
  ).length;
  $navigationBatch.uiStateCount = $navigationBatch.childEnvelopes.filter(
    env => env.type === "ui_states",
  ).length;
};

interface NavigationBatchPreprocessorOptions {
  navigationAgeThresholdInSeconds: number;
  navigationBatchChildEnvelopeAgeThresholdInSeconds: number;
  orphanAgeThresholdInSeconds: number;
}
/**
 * Groups incoming payloads by navigation.
 * The strange implementation of the processing is mainly
 * due to the flexible ordering of the incoming payloads,
 * eg payloads related to a specific navigation may arrive before
 * the corresponding navigation.
 */
export class NavigationBatchPreprocessor {
  public navigationAgeThresholdInSeconds: number;
  public navigationBatchChildEnvelopeAgeThresholdInSeconds: number;
  public orphanAgeThresholdInSeconds: number;

  constructor(options: NavigationBatchPreprocessorOptions) {
    const {
      navigationAgeThresholdInSeconds,
      navigationBatchChildEnvelopeAgeThresholdInSeconds,
      orphanAgeThresholdInSeconds,
    } = options;
    this.navigationAgeThresholdInSeconds = navigationAgeThresholdInSeconds;
    this.navigationBatchChildEnvelopeAgeThresholdInSeconds = navigationBatchChildEnvelopeAgeThresholdInSeconds;
    this.orphanAgeThresholdInSeconds = orphanAgeThresholdInSeconds;
  }

  /**
   * Method that is meant to be overridden and implement trimming of
   * navigation batches at the end of the processing flow.
   */
  public processedNavigationBatchTrimmer: (
    navigationBatch: NavigationBatch | TrimmedNavigationBatch,
  ) => TrimmedNavigationBatch = (
    navigationBatch: TrimmedNavigationBatch,
  ): TrimmedNavigationBatch => {
    return {
      ...navigationBatch,
      trimmedHttpRequestCount: -1,
      trimmedHttpResponseCount: -1,
      trimmedHttpRedirectCount: -1,
      trimmedJavascriptOperationCount: -1,
      trimmedCapturedContentCount: -1,
      trimmedUiInteractionCount: -1,
      trimmedUiStateCount: -1,
    };
  };
  public openWpmPayloadEnvelopeProcessQueue: OpenWpmPayloadEnvelope[] = [];
  public navigationBatchesByNavigationUuid: TrimmedNavigationBatchesByUuid = {};

  async submitOpenWPMPayload(type: OpenWPMType, payload: any) {
    // console.log({ type, payload });
    const openWpmPayloadEnvelope: OpenWpmPayloadEnvelope = {
      ...openWpmPayloadEnvelopeFromOpenWpmTypeAndPayload(type, payload),
    };
    return this.queueOrIgnore(openWpmPayloadEnvelope);
  }

  private async queueOrIgnore(openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) {
    // Any http or javascript packet with window, tab and frame ids are
    // sent for batching by corresponding navigation
    // or dropped (if no corresponding navigation showed up)
    if (this.shouldBeBatched(openWpmPayloadEnvelope)) {
      this.queueForProcessing(openWpmPayloadEnvelope);
      return;
    }

    // Ignoring non-batchable payloads currently
    // return this.foo(openWpmPayloadEnvelope);
  }

  public queueForProcessing(openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) {
    this.openWpmPayloadEnvelopeProcessQueue.push(openWpmPayloadEnvelope);
  }

  public shouldBeBatched(openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) {
    if (openWpmPayloadEnvelope.type === "navigations") {
      return true;
    }
    return (
      this.batchableChildOpenWpmType(openWpmPayloadEnvelope.type) &&
      this.childCanBeMatchedToWebNavigationFrame(
        batchableChildOpenWpmPayloadFromOpenWpmPayloadEnvelope(
          openWpmPayloadEnvelope,
        ),
      )
    );
  }

  private batchableChildOpenWpmType(type: OpenWPMType) {
    return [
      "http_requests",
      "http_responses",
      "http_redirects",
      "javascript",
      "openwpm_captured_content",
      "ui_interactions",
      "ui_states",
    ].includes(type);
  }

  private childCanBeMatchedToWebNavigationFrame(
    payload: BatchableChildOpenWPMPayload,
  ) {
    return (
      payload.extension_session_uuid &&
      payload.window_id > -1 &&
      payload.tab_id > -1 &&
      payload.frame_id > -1 &&
      payload.event_ordinal &&
      payload.time_stamp
    );
  }

  private alarmName: string;

  public async run(
    onAfterQueueProcessed: (
      navigationBatchesByUuid: TrimmedNavigationBatchesByUuid,
    ) => Promise<void>,
  ) {
    this.alarmName = `${browser.runtime.id}:queueProcessorAlarm`;
    const alarmListener = async _alarm => {
      if (_alarm.name !== this.alarmName) {
        return false;
      }
      console.info(
        `Processing ${this.openWpmPayloadEnvelopeProcessQueue.length} study payloads to group by navigation`,
      );
      try {
        await this.processQueue();
        await onAfterQueueProcessed(this.navigationBatchesByNavigationUuid);
      } catch (error) {
        captureExceptionWithExtras(error, {
          msg: "Error encountered during periodic queue processing",
        });
        console.error(
          "Error encountered during periodic queue processing",
          error,
        );
      }
    };
    browser.alarms.onAlarm.addListener(alarmListener);
    browser.alarms.create(this.alarmName, {
      periodInMinutes: 1, // every minute
    });
  }

  public async cleanup() {
    if (this.alarmName) {
      await browser.alarms.clear(this.alarmName);
    }
    this.reset();
  }

  public reset() {
    this.openWpmPayloadEnvelopeProcessQueue = [];
    this.navigationBatchesByNavigationUuid = {};
  }

  /**
   * Removes study payload envelopes from the queue, grouped by their presumed
   * originating web navigations
   * @param nowDateTime
   */
  public async processQueue(nowDateTime: Date = new Date()) {
    // Flush current queue for processing (we will later put back
    // elements that should be processed in an upcoming iteration)
    const { openWpmPayloadEnvelopeProcessQueue } = this;
    this.openWpmPayloadEnvelopeProcessQueue = [];

    await this.sortEnvelopesIntoBatchesAndPurgeOldEnoughEnvelopes(
      nowDateTime,
      openWpmPayloadEnvelopeProcessQueue,
    );
    this.detectAndMoveStrayHttpRequestEnvelopesToTheBatchOfItsResponse(
      openWpmPayloadEnvelopeProcessQueue,
    );
    await this.dropOldOrphanedEnvelopes(
      nowDateTime,
      openWpmPayloadEnvelopeProcessQueue,
    );
  }

  public async sortEnvelopesIntoBatchesAndPurgeOldEnoughEnvelopes(
    nowDateTime: Date,
    openWpmPayloadEnvelopeProcessQueue: OpenWpmPayloadEnvelope[],
  ) {
    // Navigations ...
    const webNavigationOpenWpmPayloadEnvelopes = openWpmPayloadEnvelopeProcessQueue.filter(
      (openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) => {
        return openWpmPayloadEnvelope.type === "navigations";
      },
    );

    // ... that are more than navigationAgeThresholdInSeconds seconds old
    const navigationIsOldEnoughToBePurged = (navigation: Navigation) => {
      return !isoDateTimeStringsWithinFutureSecondThreshold(
        navigation.committed_time_stamp,
        nowDateTime.toISOString(),
        this.navigationAgeThresholdInSeconds,
      );
    };

    const navigationBatchChildEnvelopeIsOldEnoughToBePurged = (
      navigationBatchChildPayload: BatchableChildOpenWPMPayload,
    ) => {
      return !isoDateTimeStringsWithinFutureSecondThreshold(
        navigationBatchChildPayload.time_stamp,
        nowDateTime.toISOString(),
        this.navigationBatchChildEnvelopeAgeThresholdInSeconds,
      );
    };

    const sameFrame = (
      subject: BatchableChildOpenWPMPayload | Navigation,
      navigation: Navigation,
    ) => {
      return (
        subject.extension_session_uuid === navigation.extension_session_uuid &&
        subject.window_id === navigation.window_id &&
        subject.tab_id === navigation.tab_id &&
        subject.frame_id === navigation.frame_id
      );
    };

    const withinNavigationEventOrdinalBounds = (
      eventOrdinal: number,
      fromEventOrdinal: number,
      toEventOrdinal: number,
    ) => {
      return fromEventOrdinal < eventOrdinal && eventOrdinal < toEventOrdinal;
    };

    // console.debug("debug processQueue", "this.openWpmPayloadEnvelopeProcessQueue.length", this.openWpmPayloadEnvelopeProcessQueue.length, "openWpmPayloadEnvelopeProcessQueue.length", openWpmPayloadEnvelopeProcessQueue.length, "webNavigationOpenWpmPayloadEnvelopes.length", webNavigationOpenWpmPayloadEnvelopes.length);
    // console.debug("JSON.stringify(openWpmPayloadEnvelopeProcessQueue)", JSON.stringify(openWpmPayloadEnvelopeProcessQueue));

    // For each navigation...

    const reprocessingQueue: OpenWpmPayloadEnvelope[] = [];
    await Promise.all(
      webNavigationOpenWpmPayloadEnvelopes.map(
        async (webNavigationOpenWpmPayloadEnvelope: OpenWpmPayloadEnvelope) => {
          const navigation: Navigation =
            webNavigationOpenWpmPayloadEnvelope.navigation;
          const purge = navigationIsOldEnoughToBePurged(navigation);

          // console.log(`Purge check for navigation with uuid ${navigation.uuid}`, {purge, navigation});

          const navigationBatch: NavigationBatch = {
            navigationEnvelope: webNavigationOpenWpmPayloadEnvelope,
            childEnvelopes: [],
            httpRequestCount: 0,
            httpResponseCount: 0,
            httpRedirectCount: 0,
            javascriptOperationCount: 0,
            capturedContentCount: 0,
            uiInteractionCount: 0,
            uiStateCount: 0,
          };

          // Remove navigation envelope from this run's processing queue
          removeItemFromArray(
            openWpmPayloadEnvelopeProcessQueue,
            webNavigationOpenWpmPayloadEnvelope,
          );

          // ... but be sure to re-add it afterwards to ensure that the navigation
          // stays available for processing of future payloads (until the
          // navigation is old enough to be purged / ignored)
          if (!purge) {
            reprocessingQueue.push(webNavigationOpenWpmPayloadEnvelope);
          }

          // Find potential subsequent same-frame navigations
          const subsequentNavigationsMatchingThisNavigationsFrame = openWpmPayloadEnvelopeProcessQueue.filter(
            (openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) => {
              switch (openWpmPayloadEnvelope.type) {
                case "navigations":
                  return (
                    sameFrame(openWpmPayloadEnvelope.navigation, navigation) &&
                    withinNavigationEventOrdinalBounds(
                      openWpmPayloadEnvelope.navigation
                        .before_navigate_event_ordinal !== undefined
                        ? openWpmPayloadEnvelope.navigation
                            .before_navigate_event_ordinal
                        : openWpmPayloadEnvelope.navigation
                            .committed_event_ordinal,
                      navigation.before_navigate_event_ordinal !== undefined
                        ? navigation.before_navigate_event_ordinal
                        : navigation.committed_event_ordinal,
                      Number.MAX_SAFE_INTEGER,
                    )
                  );
              }
              return false;
            },
          );

          // console.log("subsequentNavigationsMatchingThisNavigationsFrame.length", subsequentNavigationsMatchingThisNavigationsFrame.length,);

          // Assign matching children to this navigation
          const fromEventOrdinal =
            navigation.before_navigate_event_ordinal !== undefined
              ? navigation.before_navigate_event_ordinal
              : navigation.committed_event_ordinal;
          const toEventOrdinal =
            subsequentNavigationsMatchingThisNavigationsFrame.length === 0
              ? Number.MAX_SAFE_INTEGER
              : subsequentNavigationsMatchingThisNavigationsFrame[0].navigation
                  .before_navigate_event_ordinal !== undefined
              ? subsequentNavigationsMatchingThisNavigationsFrame[0].navigation
                  .before_navigate_event_ordinal
              : subsequentNavigationsMatchingThisNavigationsFrame[0].navigation
                  .committed_event_ordinal;

          // Only non-navigations can be assigned navigation parents
          const childCandidates = openWpmPayloadEnvelopeProcessQueue.filter(
            (openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) => {
              return this.batchableChildOpenWpmType(
                openWpmPayloadEnvelope.type,
              );
            },
          );

          // console.log("childCandidates.length", childCandidates.length, {fromEventOrdinal, toEventOrdinal});

          // Assign children to this navigation batch if relevant
          childCandidates.forEach(
            (openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) => {
              // Which are found in the same frame and navigation event ordinal bounds
              const payload: BatchableChildOpenWPMPayload = batchableChildOpenWpmPayloadFromOpenWpmPayloadEnvelope(
                openWpmPayloadEnvelope,
              ) as BatchableChildOpenWPMPayload;
              const isSameFrame = sameFrame(payload, navigation);
              const isWithinNavigationEventOrdinalBounds = withinNavigationEventOrdinalBounds(
                payload.event_ordinal,
                fromEventOrdinal,
                toEventOrdinal,
              );
              const isWithinNavigationEventAgeThreshold = isoDateTimeStringsWithinFutureSecondThreshold(
                navigation.before_navigate_time_stamp !== undefined
                  ? navigation.before_navigate_time_stamp
                  : navigation.committed_time_stamp,
                payload.time_stamp,
                this.navigationAgeThresholdInSeconds,
              );
              // console.debug({type: openWpmPayloadEnvelope.type, event_ordinal: payload.event_ordinal, isSameFrame, isWithinNavigationEventOrdinalBounds, isWithinNavigationEventAgeThreshold});
              if (isSameFrame && isWithinNavigationEventOrdinalBounds) {
                if (isWithinNavigationEventAgeThreshold) {
                  navigationBatch.childEnvelopes.push(openWpmPayloadEnvelope);
                  setEnvelopeCounts(navigationBatch);
                }
                // Remove from queue since it has been adopted by a navigation batch
                removeItemFromArray(
                  openWpmPayloadEnvelopeProcessQueue,
                  openWpmPayloadEnvelope,
                );
              }
            },
          );

          // console.log("navigationBatch.childEnvelopes.length", navigationBatch.childEnvelopes.length);

          if (purge) {
            // Remove from navigationBatchesByNavigationUuid
            // console.log(`Removing expired navigation with uuid ${navigation.uuid}`);
            delete this.navigationBatchesByNavigationUuid[navigation.uuid];
          } else {
            // Update navigationBatchesByNavigationUuid
            let updatedNavigationBatch;
            if (this.navigationBatchesByNavigationUuid[navigation.uuid]) {
              const existingNavigationBatch = this
                .navigationBatchesByNavigationUuid[navigation.uuid];
              updatedNavigationBatch = {
                ...existingNavigationBatch,
                childEnvelopes: existingNavigationBatch.childEnvelopes.concat(
                  navigationBatch.childEnvelopes,
                ),
              };
              setEnvelopeCounts(updatedNavigationBatch);
            } else {
              updatedNavigationBatch = navigationBatch;
            }
            // Only include young enough child envelopes
            updatedNavigationBatch.childEnvelopes = updatedNavigationBatch.childEnvelopes.filter(
              openWpmPayloadEnvelope => {
                const payload: BatchableChildOpenWPMPayload = batchableChildOpenWpmPayloadFromOpenWpmPayloadEnvelope(
                  openWpmPayloadEnvelope,
                ) as BatchableChildOpenWPMPayload;
                return !navigationBatchChildEnvelopeIsOldEnoughToBePurged(
                  payload,
                );
              },
            );
            // Run the general callback for trimming navigation batches further
            updatedNavigationBatch = this.processedNavigationBatchTrimmer(
              updatedNavigationBatch,
            );
            this.navigationBatchesByNavigationUuid[
              navigation.uuid
            ] = updatedNavigationBatch;
          }
        },
      ),
    );

    // Restore relevant items to the processing queue
    reprocessingQueue.reverse().map(openWpmPayloadEnvelope => {
      this.openWpmPayloadEnvelopeProcessQueue.unshift(openWpmPayloadEnvelope);
    });
  }

  public detectAndMoveStrayHttpRequestEnvelopesToTheBatchOfItsResponse(
    openWpmPayloadEnvelopeProcessQueue: OpenWpmPayloadEnvelope[],
  ) {
    const navUuids = Object.keys(this.navigationBatchesByNavigationUuid);
    navUuids.map(navUuid => {
      const currentNavigationBatch = this.navigationBatchesByNavigationUuid[
        navUuid
      ];

      const httpResponseEnvelopes: OpenWpmPayloadEnvelope[] = currentNavigationBatch.childEnvelopes.filter(
        (openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) =>
          openWpmPayloadEnvelope.type === "http_responses",
      );

      const httpRequestEnvelopes: OpenWpmPayloadEnvelope[] = currentNavigationBatch.childEnvelopes.filter(
        (openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) =>
          openWpmPayloadEnvelope.type === "http_requests",
      );

      // console.debug({ httpResponseEnvelopes, httpRequestEnvelopes });

      // Sometimes http request envelopes were created within the lifespan of a previous webNavigation
      // thus we need to check for http responses without http request counterparts
      httpResponseEnvelopes.forEach(
        (currentHttpResponseEnvelope: OpenWpmPayloadEnvelope) => {
          const httpRequestEnvelopeMatcher = childEnvelope =>
            childEnvelope.type === "http_requests" &&
            childEnvelope.httpRequest.request_id ===
              currentHttpResponseEnvelope.httpResponse.request_id;
          const httpRequestEnvelope = httpRequestEnvelopes.find(
            httpRequestEnvelopeMatcher,
          );
          if (!httpRequestEnvelope) {
            // console.debug("move the stray http request envelope to the same batch where their response envelope is", {currentHttpResponseEnvelope});
            let correspondingHttpRequest;
            // console.debug("check other navigation batches for the stray envelope");
            const navUuidsToCheck = Object.keys(
              this.navigationBatchesByNavigationUuid,
            ).filter(navUuidToCheck => navUuidToCheck !== navUuid);
            navUuidsToCheck.some(navUuidToCheck => {
              const candidateNavigationBatch = this
                .navigationBatchesByNavigationUuid[navUuidToCheck];
              const matchingHttpRequestEnvelope = candidateNavigationBatch.childEnvelopes
                .reverse()
                .find(httpRequestEnvelopeMatcher);
              if (matchingHttpRequestEnvelope) {
                correspondingHttpRequest = matchingHttpRequestEnvelope;
                // remove from candidateNavigationBatch
                removeItemFromArray(
                  candidateNavigationBatch.childEnvelopes,
                  matchingHttpRequestEnvelope,
                );
                setEnvelopeCounts(candidateNavigationBatch);
                return true;
              }
              return false;
            });

            if (!correspondingHttpRequest) {
              // console.debug("check the unprocessed queue for the stray envelopes");
              const matchingHttpRequestEnvelope = openWpmPayloadEnvelopeProcessQueue
                .reverse()
                .find(httpRequestEnvelopeMatcher);
              if (matchingHttpRequestEnvelope) {
                correspondingHttpRequest = matchingHttpRequestEnvelope;
                // remove from the unprocessed queue
                removeItemFromArray(
                  openWpmPayloadEnvelopeProcessQueue,
                  matchingHttpRequestEnvelope,
                );
              }
            }

            if (correspondingHttpRequest) {
              // console.debug("adding the stray envelope to this navigation batch since it was found");
              currentNavigationBatch.childEnvelopes.unshift(
                correspondingHttpRequest,
              );
              setEnvelopeCounts(currentNavigationBatch);
            } else {
              console.error(
                `The matching httpRequestEnvelope was not found for request id ${currentHttpResponseEnvelope.httpResponse.request_id}`,
                {
                  currentHttpResponseEnvelope,
                },
              );
              captureExceptionWithExtras(
                new Error(
                  `The matching httpRequestEnvelope was not found for request id ${currentHttpResponseEnvelope.httpResponse.request_id}`,
                ),
                {
                  request_id:
                    currentHttpResponseEnvelope.httpResponse.request_id,
                },
                Sentry.Severity.Warning,
              );
              // remove the http response since it will cause issues downstream if it is kept
              // (developer note: comment out the removal code below to be able to collect
              // a relevant fixture to debug this issue, which most often occurs in conjunction
              // with extension reloads, but may possibly occur in other contexts as well.
              // Note that tests will fail as long as the code below is commented out)
              removeItemFromArray(
                currentNavigationBatch.childEnvelopes,
                currentHttpResponseEnvelope,
              );
              setEnvelopeCounts(currentNavigationBatch);
            }
          }
        },
      );
    });
  }

  public async dropOldOrphanedEnvelopes(
    nowDateTime: Date,
    openWpmPayloadEnvelopeProcessQueue: OpenWpmPayloadEnvelope[],
  ) {
    // Drop old orphaned items (assumption: whose navigation batches have already
    // been purged and thus not sorted into a queued navigation event above)

    const childIsOldEnoughToBeAnOrphan = (
      payload: BatchableChildOpenWPMPayload,
    ) => {
      return !isoDateTimeStringsWithinFutureSecondThreshold(
        payload.time_stamp,
        nowDateTime.toISOString(),
        this.orphanAgeThresholdInSeconds,
      );
    };

    const openWpmPayloadEnvelopesWithoutMatchingNavigations = openWpmPayloadEnvelopeProcessQueue;

    const orphanedOpenWpmPayloadEnvelopes = [];

    openWpmPayloadEnvelopesWithoutMatchingNavigations
      .reverse()
      .forEach(openWpmPayloadEnvelope => {
        const payload: BatchableChildOpenWPMPayload = batchableChildOpenWpmPayloadFromOpenWpmPayloadEnvelope(
          openWpmPayloadEnvelope,
        );

        if (!childIsOldEnoughToBeAnOrphan(payload)) {
          this.openWpmPayloadEnvelopeProcessQueue.unshift(
            openWpmPayloadEnvelope,
          );
        } else {
          orphanedOpenWpmPayloadEnvelopes.unshift(openWpmPayloadEnvelope);
        }
      });

    // console.debug("Orphaned items debug", orphanedOpenWpmPayloadEnvelopes);
  }
}

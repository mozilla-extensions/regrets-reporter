import {
  HttpRedirect,
  HttpRequest,
  HttpResponse,
  JavascriptCookieRecord,
  JavascriptOperation,
  Navigation,
} from "@openwpm/webext-instrumentation";
import { CapturedContent, LogEntry } from "./dataReceiver";
import { TelemetrySender } from "./TelemetrySender";
import { isoDateTimeStringsWithinFutureSecondThreshold } from "./dateUtils";

declare namespace browser.alarms {
  function create(
    name: string,
    alarmInfo: {
      /** Time when the alarm is scheduled to first fire, in milliseconds past the epoch. */
      when?: number;
      /** Number of minutes from the current time after which the alarm should first fire. */
      delayInMinutes?: number;
      /** Number of minutes after which the alarm should recur repeatedly. */
      periodInMinutes?: number;
    },
  ): void;
  function clear(name: string): boolean;
}

declare namespace browser.alarms.onAlarm {
  function addListener(listener: any);
  function removeListener(listener: any);
}

declare namespace browser.runtime {
  const id: any;
}

export interface NavigationBatch {
  navigationEnvelope: StudyPayloadEnvelope;
  childEnvelopes: StudyPayloadEnvelope[];
  httpRequestCount: number;
  httpResponseCount: number;
  httpRedirectCount: number;
  javascriptOperationCount: number;
}

export interface TrimmedNavigationBatch extends NavigationBatch {
  trimmedHttpRequestCount: number;
  trimmedHttpResponseCount: number;
  trimmedHttpRedirectCount: number;
  trimmedJavascriptOperationCount: number;
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
  | "openwpm_captured_content";

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
  | CapturedContent;

type BatchableOpenWPMPayload =
  | Navigation
  | HttpRequest
  | HttpResponse
  | HttpRedirect
  | JavascriptOperation;

type BatchableChildOpenWPMPayload =
  | HttpRequest
  | HttpResponse
  | HttpRedirect
  | JavascriptOperation;

/**
 * The basic packet structure and target for study analysis
 */
export interface StudyPayloadEnvelope {
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
  tabActiveDwellTime?: number;
}

/**
 * Additional fields are relevant at the study telemetry packet level
 * since we drop the `payload` attribute if the calculatedPingSize
 * exceeds a certain threshold
 */
export interface StudyTelemetryPacket extends StudyPayloadEnvelope {
  calculatedPingSize: string;
  originalCalculatedPingSize: string;
}

export const batchableOpenWpmPayloadFromStudyPayloadEnvelope = (
  studyPayloadEnvelope: StudyPayloadEnvelope,
): BatchableOpenWPMPayload => {
  switch (studyPayloadEnvelope.type) {
    case "navigations":
      return studyPayloadEnvelope.navigation as Navigation;
    case "http_requests":
      return studyPayloadEnvelope.httpRequest as HttpRequest;
    case "http_responses":
      return studyPayloadEnvelope.httpResponse as HttpResponse;
    case "http_redirects":
      return studyPayloadEnvelope.httpRedirect as HttpRedirect;
    case "javascript":
      return studyPayloadEnvelope.javascriptOperation as JavascriptOperation;
  }
  throw new Error(`Unexpected type supplied: '${studyPayloadEnvelope.type}'`);
};

export const studyPayloadEnvelopeFromOpenWpmTypeAndPayload = (
  type: OpenWPMType,
  payload: OpenWPMPayload,
): StudyPayloadEnvelope => {
  const studyPayloadEnvelope: StudyPayloadEnvelope = {
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
  };
  return studyPayloadEnvelope;
};

const removeItemFromArray = (ar, el) => {
  ar.splice(ar.indexOf(el), 1);
};

export class NavigationBatchPreprocessor {
  public studyPayloadEnvelopeProcessQueue: StudyPayloadEnvelope[] = [];
  public navigationBatchSendQueue: NavigationBatch[] = [];
  public queueForProcessing(studyPayloadEnvelope: StudyPayloadEnvelope) {
    this.studyPayloadEnvelopeProcessQueue.push(studyPayloadEnvelope);
  }
  public shouldBeBatched(studyPayloadEnvelope: StudyPayloadEnvelope) {
    return (
      this.batchableOpenWpmType(studyPayloadEnvelope.type) &&
      this.canBeMatchedToWebNavigationFrame(
        batchableOpenWpmPayloadFromStudyPayloadEnvelope(studyPayloadEnvelope),
      )
    );
  }
  private batchableOpenWpmType(type: OpenWPMType) {
    return [
      "navigations",
      "http_requests",
      "http_responses",
      "http_redirects",
      "javascript",
    ].includes(type);
  }
  private canBeMatchedToWebNavigationFrame(payload: BatchableOpenWPMPayload) {
    return (
      payload.extension_session_uuid &&
      payload.window_id > -1 &&
      payload.tab_id > -1 &&
      payload.frame_id > -1
    );
  }

  private telemetrySender: TelemetrySender;
  public setTelemetrySender(value: TelemetrySender) {
    this.telemetrySender = value;
  }

  private alarmName: string;

  public async run() {
    this.alarmName = `${browser.runtime.id}:queueProcessorAlarm`;
    const alarmListener = async _alarm => {
      console.info(
        `Processing ${this.studyPayloadEnvelopeProcessQueue.length} study payloads to batch and send grouped by navigation`,
      );
      await this.processQueue();
      if (this.telemetrySender) {
        await this.sendQueuedNavigationBatches();
      }
    };
    browser.alarms.onAlarm.addListener(alarmListener);
    browser.alarms.create(this.alarmName, {
      periodInMinutes: 10 / 60, // every 10 seconds
    });
  }

  public async sendQueuedNavigationBatches() {
    const navigationBatchSendQueue = this.navigationBatchSendQueue;
    console.info(
      `Sending the ${navigationBatchSendQueue.length} navigation batches that are old enough`,
    );
    navigationBatchSendQueue.map(async (navigationBatch: NavigationBatch) => {
      const studyPayloadEnvelope: StudyPayloadEnvelope = {
        type: "navigation_batches",
        navigationBatch,
      };
      await this.telemetrySender.sendStudyPayloadEnvelope(studyPayloadEnvelope);
      removeItemFromArray(this.navigationBatchSendQueue, navigationBatch);
    });
  }

  public async cleanup() {
    if (this.alarmName) {
      await browser.alarms.clear(this.alarmName);
    }
    this.studyPayloadEnvelopeProcessQueue = [];
    this.navigationBatchSendQueue = [];
  }

  /**
   * Removes study payload envelopes from the queue, grouped by their presumed
   * originating web navigations
   * @param nowDateTime
   */
  public async processQueue(nowDateTime: Date = new Date()) {
    const navigationAgeThresholdInSeconds: number = 10;
    const orphanAgeThresholdInSeconds: number = 25;

    // Flush current queue for processing (we will later put back
    // elements that should be processed in an upcoming iteration)
    const { studyPayloadEnvelopeProcessQueue } = this;
    this.studyPayloadEnvelopeProcessQueue = [];

    // Navigations ...
    const webNavigationStudyPayloadEnvelopes = studyPayloadEnvelopeProcessQueue.filter(
      (studyPayloadEnvelope: StudyPayloadEnvelope) => {
        return studyPayloadEnvelope.type === "navigations";
      },
    );

    // ... that are more than navigationAgeThresholdInSeconds seconds old
    const navigationIsOldEnoughToBeSent = (navigation: Navigation) => {
      return !isoDateTimeStringsWithinFutureSecondThreshold(
        navigation.committed_time_stamp,
        nowDateTime.toISOString(),
        navigationAgeThresholdInSeconds,
      );
    };

    const sameFrame = (
      subject:
        | Navigation
        | HttpRequest
        | HttpResponse
        | HttpRedirect
        | JavascriptOperation,
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

    // console.log("debug processQueue", studyPayloadEnvelopeProcessQueue.length, webNavigationStudyPayloadEnvelopes.length);
    // console.log("JSON.stringify(studyPayloadEnvelopeProcessQueue)", JSON.stringify(studyPayloadEnvelopeProcessQueue));

    // For each navigation...
    const reprocessingQueue: StudyPayloadEnvelope[] = [];
    webNavigationStudyPayloadEnvelopes.map(
      (webNavigationStudyPayloadEnvelope: StudyPayloadEnvelope) => {
        const navigation: Navigation =
          webNavigationStudyPayloadEnvelope.navigation;
        const send = navigationIsOldEnoughToBeSent(navigation);

        // console.log("navigation, send", navigation, send);

        const navigationBatch: NavigationBatch = {
          navigationEnvelope: webNavigationStudyPayloadEnvelope,
          childEnvelopes: [],
          httpRequestCount: 0,
          httpResponseCount: 0,
          httpRedirectCount: 0,
          javascriptOperationCount: 0,
        };

        // Remove navigation envelope from the processing queue
        removeItemFromArray(
          studyPayloadEnvelopeProcessQueue,
          webNavigationStudyPayloadEnvelope,
        );

        // Mark for reprocessing if it is not going to be sent now
        if (!send) {
          reprocessingQueue.push(webNavigationStudyPayloadEnvelope);
        }

        // Find potential subsequent same-frame navigations
        const subsequentNavigationsMatchingThisNavigationsFrame = studyPayloadEnvelopeProcessQueue.filter(
          (studyPayloadEnvelope: StudyPayloadEnvelope) => {
            switch (studyPayloadEnvelope.type) {
              case "navigations":
                return (
                  sameFrame(studyPayloadEnvelope.navigation, navigation) &&
                  withinNavigationEventOrdinalBounds(
                    studyPayloadEnvelope.navigation
                      .before_navigate_event_ordinal,
                    navigation.before_navigate_event_ordinal,
                    Number.MAX_SAFE_INTEGER,
                  )
                );
            }
            return false;
          },
        );

        // console.log("subsequentNavigationsMatchingThisNavigationsFrame.length", subsequentNavigationsMatchingThisNavigationsFrame.length,);

        // Assign matching children to this navigation
        const fromEventOrdinal = navigation.before_navigate_event_ordinal;
        const toEventOrdinal =
          subsequentNavigationsMatchingThisNavigationsFrame.length === 0
            ? Number.MAX_SAFE_INTEGER
            : subsequentNavigationsMatchingThisNavigationsFrame[0].navigation
                .before_navigate_event_ordinal;

        // Only non-navigations can be assigned navigation parents
        const childCandidates = studyPayloadEnvelopeProcessQueue.filter(
          (studyPayloadEnvelope: StudyPayloadEnvelope) => {
            return this.batchableOpenWpmType(studyPayloadEnvelope.type);
          },
        );

        // console.log("childCandidates.length", childCandidates.length);

        const studyPayloadEnvelopesAssignedToThisNavigation = childCandidates.filter(
          (studyPayloadEnvelope: StudyPayloadEnvelope) => {
            // Which are found in the same frame and navigation event ordinal bounds
            const payload: BatchableChildOpenWPMPayload = batchableOpenWpmPayloadFromStudyPayloadEnvelope(
              studyPayloadEnvelope,
            ) as BatchableChildOpenWPMPayload;
            const isSameFrame = sameFrame(payload, navigation);
            const isWithinNavigationEventOrdinalBounds = withinNavigationEventOrdinalBounds(
              payload.event_ordinal,
              fromEventOrdinal,
              toEventOrdinal,
            );
            const isWithinNavigationEventAgeThreshold = isoDateTimeStringsWithinFutureSecondThreshold(
              navigation.committed_time_stamp,
              payload.time_stamp,
              navigationAgeThresholdInSeconds,
            );
            // console.log("studyPayloadEnvelope.type, isSameFrame, isWithinNavigationEventOrdinalBounds, isWithinNavigationEventAgeThreshold", studyPayloadEnvelope.type, isSameFrame, isWithinNavigationEventOrdinalBounds, isWithinNavigationEventAgeThreshold);
            if (isSameFrame && isWithinNavigationEventOrdinalBounds) {
              if (isWithinNavigationEventAgeThreshold) {
                navigationBatch.childEnvelopes.push(studyPayloadEnvelope);
                // Keep track of envelope counts by type
                switch (studyPayloadEnvelope.type) {
                  case "http_requests":
                    navigationBatch.httpRequestCount++;
                    break;
                  case "http_responses":
                    navigationBatch.httpResponseCount++;
                    break;
                  case "http_redirects":
                    navigationBatch.httpRedirectCount++;
                    break;
                  case "javascript":
                    navigationBatch.javascriptOperationCount++;
                    break;
                }
              }
              removeItemFromArray(
                studyPayloadEnvelopeProcessQueue,
                studyPayloadEnvelope,
              );
              return true;
            }
            return false;
          },
        );

        // console.log("studyPayloadEnvelopesAssignedToThisNavigation.length", studyPayloadEnvelopesAssignedToThisNavigation.length,);

        if (send) {
          this.navigationBatchSendQueue.push(navigationBatch);
        } else {
          // Mark unsent items for reprocessing
          studyPayloadEnvelopesAssignedToThisNavigation.map(
            (studyPayloadEnvelope: StudyPayloadEnvelope) => {
              reprocessingQueue.push(studyPayloadEnvelope);
            },
          );
        }
      },
    );

    // Restore unsent items to the queue

    reprocessingQueue.reverse().map(studyPayloadEnvelope => {
      this.studyPayloadEnvelopeProcessQueue.unshift(studyPayloadEnvelope);
    });

    // Drop only old orphaned items (assumption: whose navigation batches have already
    // been sent and thus not sorted into a queued navigation event above)

    const childIsOldEnoughToBeAnOrphan = (
      payload: BatchableChildOpenWPMPayload,
    ) => {
      return !isoDateTimeStringsWithinFutureSecondThreshold(
        payload.time_stamp,
        nowDateTime.toISOString(),
        orphanAgeThresholdInSeconds,
      );
    };

    const studyPayloadEnvelopesWithoutMatchingNavigations = studyPayloadEnvelopeProcessQueue;

    const orphanedStudyPayloadEnvelopes = [];

    studyPayloadEnvelopesWithoutMatchingNavigations
      .reverse()
      .map(studyPayloadEnvelope => {
        const payload: BatchableChildOpenWPMPayload = batchableOpenWpmPayloadFromStudyPayloadEnvelope(
          studyPayloadEnvelope,
        ) as BatchableChildOpenWPMPayload;

        if (!childIsOldEnoughToBeAnOrphan(payload)) {
          this.studyPayloadEnvelopeProcessQueue.unshift(studyPayloadEnvelope);
        } else {
          orphanedStudyPayloadEnvelopes.unshift(studyPayloadEnvelope);
        }
      });

    // console.log("Orphaned items debug", orphanedStudyPayloadEnvelopes);
  }
}

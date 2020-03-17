import { humanFileSize } from "./humanFileSize";

import {
  OpenWPMType,
  StudyPayloadEnvelope,
  studyPayloadEnvelopeFromOpenWpmTypeAndPayload,
  StudyPayloadPreprocessor,
  StudyTelemetryPacket,
  TrimmedNavigationBatch,
} from "./StudyPayloadPreprocessor";
import { escapeString } from "@openwpm/webext-instrumentation";
import { browser } from "webextension-polyfill-ts";

export const thresholdSize = 1024 * 500;

/**
 * Shield utils schema requires all study telemetry packet
 * attributes to be strings
 */
export interface StringifiedStudyTelemetryPacket {
  type: string;
  navigation?: string;
  navigationBatch?: string;
  trimmedNavigationBatch?: string;
  httpRequest?: string;
  httpResponse?: string;
  httpRedirect?: string;
  javascriptOperation?: string;
  javascriptCookieRecord?: string;
  logEntry?: string;
  capturedContent?: string;
  calculatedPingSize: string;
  originalCalculatedPingSize: string;
  tabActiveDwellTime?: string;
}

export class TelemetrySender {
  private studyPayloadPreprocessor: StudyPayloadPreprocessor;
  constructor(studyPayloadPreprocessor: StudyPayloadPreprocessor) {
    studyPayloadPreprocessor.setTelemetrySender(this);
    this.studyPayloadPreprocessor = studyPayloadPreprocessor;
  }

  async submitOpenWPMPayload(
    type: OpenWPMType,
    payload: any,
    tabActiveDwellTime: number = null,
  ) {
    if (browser.extension.inIncognitoContext) {
      // drop the ping - do not send any telemetry
      console.log("browser.extension.inIncognitoContext true, dropping ping");
      return;
    }

    const studyPayloadEnvelope: StudyPayloadEnvelope = {
      ...studyPayloadEnvelopeFromOpenWpmTypeAndPayload(type, payload),
      tabActiveDwellTime,
    };

    return this.queueOrSend(studyPayloadEnvelope);
  }

  private async queueOrSend(studyPayloadEnvelope: StudyPayloadEnvelope) {
    // Any http or javascript packet with tabId is sent for batching by corresponding navigation
    // or dropped (if no corresponding navigation showed up)
    if (this.studyPayloadPreprocessor.shouldBeBatched(studyPayloadEnvelope)) {
      this.studyPayloadPreprocessor.queueForProcessing(studyPayloadEnvelope);
      return;
    }

    return this.sendStudyPayloadEnvelope(studyPayloadEnvelope);
  }

  public async sendStudyPayloadEnvelope(
    studyPayloadEnvelope: StudyPayloadEnvelope,
  ) {
    const sizedAndPrepared = await this.prepareForTelemetry(
      studyPayloadEnvelope,
    );
    const acceptablySizedReadyForSending = await this.ensurePingSizeUnderThreshold(
      sizedAndPrepared,
      studyPayloadEnvelope,
    );
    return this.sendTelemetry(acceptablySizedReadyForSending);
  }

  private async prepareForTelemetry(
    studyPayloadEnvelope: StudyPayloadEnvelope,
    originalCalculatedPingSize: number = null,
  ) {
    const studyTelemetryPacket: StudyTelemetryPacket = {
      ...studyPayloadEnvelope,
      calculatedPingSize: "0000000000", // Will be replaced below with the real (approximate) calculated ping size
      originalCalculatedPingSize: "0000000000", // Will be replaced below with the real (approximate) calculated ping size
    };
    const sizedAndPrepared: StringifiedStudyTelemetryPacket = this.stringifyPayload(
      studyTelemetryPacket,
    );
    /*
    const calculatedPingSize = await browser.study.calculateTelemetryPingSize(
      sizedAndPrepared,
    );
    sizedAndPrepared.calculatedPingSize = String(calculatedPingSize);
    sizedAndPrepared.originalCalculatedPingSize = String(
      originalCalculatedPingSize
        ? originalCalculatedPingSize
        : calculatedPingSize,
    );
     */
    return sizedAndPrepared;
  }

  /**
   * Since shield utils schema requires all study telemetry packet
   * attributes to be strings
   */
  private stringifyPayload(
    studyTelemetryPacket: StudyTelemetryPacket,
  ): StringifiedStudyTelemetryPacket {
    const stringifiedStudyTelemetryPacket: StringifiedStudyTelemetryPacket = {
      type: escapeString(studyTelemetryPacket.type),
      calculatedPingSize: JSON.stringify(
        studyTelemetryPacket.calculatedPingSize,
      ),
      originalCalculatedPingSize: JSON.stringify(
        studyTelemetryPacket.originalCalculatedPingSize,
      ),
    };
    [
      "navigation",
      "navigationBatch",
      "trimmedNavigationBatch",
      "httpRequest",
      "httpResponse",
      "httpRedirect",
      "javascriptOperation",
      "javascriptCookieRecord",
      "logEntry",
      "capturedContent",
      "tabActiveDwellTime",
    ].map(attributeToStringifyIfExists => {
      if (
        typeof studyTelemetryPacket[attributeToStringifyIfExists] !==
        "undefined"
      ) {
        stringifiedStudyTelemetryPacket[
          attributeToStringifyIfExists
        ] = JSON.stringify(studyTelemetryPacket[attributeToStringifyIfExists]);
      }
    });
    return stringifiedStudyTelemetryPacket;
  }

  /**
   * Do not let large packets through
   * @param sizedAndPrepared
   * @param studyPayloadEnvelope
   */
  private async ensurePingSizeUnderThreshold(
    sizedAndPrepared: StringifiedStudyTelemetryPacket,
    studyPayloadEnvelope: StudyPayloadEnvelope,
  ) {
    const calculatedPingSize = parseInt(
      sizedAndPrepared.calculatedPingSize,
      10,
    );
    if (calculatedPingSize > thresholdSize) {
      if (
        studyPayloadEnvelope.type === "navigation_batches" &&
        studyPayloadEnvelope.navigationBatch.childEnvelopes.length > 0
      ) {
        sizedAndPrepared = await this.trimNavigationBatch(
          sizedAndPrepared,
          studyPayloadEnvelope,
        );
      } else {
        this.dropOpenWpmPayloadAndSendStudyPayloadEnvelope(sizedAndPrepared);
      }
      // update the current ping size after trim/drop
      /*
      const calculatedPingSize = await browser.study.calculateTelemetryPingSize(
        sizedAndPrepared,
      );
      sizedAndPrepared.calculatedPingSize = String(calculatedPingSize);
       */
    }
    return sizedAndPrepared;
  }

  private async trimNavigationBatch(
    sizedAndPrepared: StringifiedStudyTelemetryPacket,
    studyPayloadEnvelope: StudyPayloadEnvelope,
  ) {
    const originalCalculatedPingSize = parseInt(
      sizedAndPrepared.originalCalculatedPingSize,
      10,
    );

    const trimmedNavigationBatch: TrimmedNavigationBatch = {
      ...studyPayloadEnvelope.navigationBatch,
      trimmedHttpRequestCount: -1,
      trimmedHttpResponseCount: -1,
      trimmedHttpRedirectCount: -1,
      trimmedJavascriptOperationCount: -1,
    };

    const maxChildEnvelopesInTrimmedNavigationBatch = 1000;

    const childEnvelopes = JSON.parse(
      JSON.stringify(trimmedNavigationBatch.childEnvelopes),
    );
    trimmedNavigationBatch.childEnvelopes = [];

    let i,
      currentCalculatedSize,
      trimmedSizedAndPrepared: StringifiedStudyTelemetryPacket,
      trimmedStudyPayloadEnvelope: StudyPayloadEnvelope;

    // initial values
    i = 0;
    do {
      i = i + 1;

      // try adding one packet at a time
      trimmedNavigationBatch.childEnvelopes = childEnvelopes.splice(0, i);
      this.updateTrimmedNavigationBatchCounts(trimmedNavigationBatch);

      // check the size with the added child envelope
      trimmedStudyPayloadEnvelope = {
        type: "trimmed_navigation_batches",
        trimmedNavigationBatch,
      };

      const trimmedSizedAndPreparedCandidate = await this.prepareForTelemetry(
        trimmedStudyPayloadEnvelope,
        originalCalculatedPingSize,
      );

      currentCalculatedSize = parseInt(
        trimmedSizedAndPreparedCandidate.calculatedPingSize,
        10,
      );

      // we happily stop adding new child envelopes when we are still
      // at 1kb under the hard threshold (1kb allows for some fuzziness
      // in how the sizes may differ slightly after this point)
      if (currentCalculatedSize > thresholdSize - 1024) {
        break;
      }

      trimmedSizedAndPrepared = trimmedSizedAndPreparedCandidate;

      // we stop if we have already included all of our child envelopes
      if (
        trimmedNavigationBatch.childEnvelopes.length >= childEnvelopes.length
      ) {
        break;
      }
    } while (i < maxChildEnvelopesInTrimmedNavigationBatch);

    // as a final safe-guard, we run the trimmed navigation
    // batch through the threshold limiter
    return await this.ensurePingSizeUnderThreshold(
      trimmedSizedAndPrepared,
      trimmedStudyPayloadEnvelope,
    );
  }

  private async updateTrimmedNavigationBatchCounts(trimmedNavigationBatch) {
    trimmedNavigationBatch.trimmedHttpRequestCount = 0;
    trimmedNavigationBatch.trimmedHttpResponseCount = 0;
    trimmedNavigationBatch.trimmedHttpRedirectCount = 0;
    trimmedNavigationBatch.trimmedJavascriptOperationCount = 0;
    trimmedNavigationBatch.childEnvelopes.map(studyPayloadEnvelope => {
      // Keep track of trimmed envelope counts by type
      switch (studyPayloadEnvelope.type) {
        case "http_requests":
          trimmedNavigationBatch.trimmedHttpRequestCount++;
          break;
        case "http_responses":
          trimmedNavigationBatch.trimmedHttpResponseCount++;
          break;
        case "http_redirects":
          trimmedNavigationBatch.trimmedHttpRedirectCount++;
          break;
        case "javascript":
          trimmedNavigationBatch.trimmedJavascriptOperationCount++;
          break;
      }
    });
  }

  private async dropOpenWpmPayloadAndSendStudyPayloadEnvelope(
    sizedAndPrepared: StringifiedStudyTelemetryPacket,
  ) {
    delete sizedAndPrepared.navigation;
    delete sizedAndPrepared.navigationBatch;
    delete sizedAndPrepared.trimmedNavigationBatch;
    delete sizedAndPrepared.httpRequest;
    delete sizedAndPrepared.httpResponse;
    delete sizedAndPrepared.httpRedirect;
    delete sizedAndPrepared.javascriptOperation;
    delete sizedAndPrepared.javascriptCookieRecord;
    delete sizedAndPrepared.logEntry;
    delete sizedAndPrepared.capturedContent;
  }

  private async sendTelemetry(
    acceptablySizedReadyForSending: StringifiedStudyTelemetryPacket,
  ) {
    const calculatedPingSize = parseInt(
      acceptablySizedReadyForSending.calculatedPingSize,
      10,
    );
    const originalCalculatedPingSize = parseInt(
      acceptablySizedReadyForSending.originalCalculatedPingSize,
      10,
    );

    let logMessage;
    logMessage = `Calculated ping size of the submitted ${
      acceptablySizedReadyForSending.type
    } ping: ${humanFileSize(calculatedPingSize)}`;
    if (originalCalculatedPingSize > thresholdSize) {
      logMessage += ` - trimmed down from ${humanFileSize(
        originalCalculatedPingSize,
      )} since the size exceeded 500kb`;
    }
    console.log(logMessage);

    console.log(
      "acceptablySizedReadyForSending",
      acceptablySizedReadyForSending,
    );
    const { seenEvents } = await browser.storage.local.get("seenEvents");
    if (seenEvents) {
      console.log("existing", { seenEvents });
      seenEvents.push(acceptablySizedReadyForSending);
      await browser.storage.local.set({ seenEvents });
    } else {
      await browser.storage.local.set({
        seenEvents: [acceptablySizedReadyForSending],
      });
    }
    console.log("Event stored");

    // return browser.study.sendTelemetry(acceptablySizedReadyForSending);
  }
}

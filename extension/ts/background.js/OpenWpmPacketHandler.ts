import { humanFileSize } from "./lib/humanFileSize";
import { NavigationBatchPreprocessor } from "./NavigationBatchPreprocessor";
import { HttpResponse, UiState } from "@openwpm/webext-instrumentation";
import { browser } from "webextension-polyfill-ts";
import { classifyYouTubeNavigationUrlType } from "./lib/youTubeNavigationUrlType";
import {
  captureExceptionWithExtras,
  Sentry,
} from "../shared-resources/ErrorReporting";
import { config } from "../config";

export interface LogEntry {
  level: string;
  msg: string;
}

export interface CapturedContent {
  decoded_content: string;
  content_hash: string;
  extension_session_uuid: string;
  window_id: number;
  tab_id: number;
  frame_id: number;
  event_ordinal: number;
  time_stamp: string;
}

const privateBrowsingActive = async () => {
  if (browser.extension.inIncognitoContext) {
    return true;
  }
};

export class OpenWpmPacketHandler {
  public navigationBatchPreprocessor: NavigationBatchPreprocessor;

  // To be able to pause and resume data collection
  public active = true;

  constructor() {
    // Setup study payload processor singleton
    this.navigationBatchPreprocessor = new NavigationBatchPreprocessor(
      config.navigationBatchProcessor,
    );
  }

  logDebug = async msg => {
    if (!this.active) {
      return;
    }
    if (await privateBrowsingActive()) {
      return;
    }
    console.debug(`OpenWPM DEBUG log message: ${msg}`);
  };

  logInfo = async msg => {
    if (!this.active) {
      return;
    }
    if (await privateBrowsingActive()) {
      return;
    }
    const level = "info";
    const logEntry: LogEntry = { level, msg };
    console.info(`OpenWPM INFO log message: ${msg}`);
    await this.navigationBatchPreprocessor.submitOpenWPMPayload(
      "openwpm_log",
      logEntry,
    );
  };

  logWarn = async msg => {
    if (!this.active) {
      return;
    }
    if (await privateBrowsingActive()) {
      return;
    }
    const level = "warn";
    const logEntry: LogEntry = { level, msg };
    captureExceptionWithExtras(
      new Error("OpenWPM WARN log message"),
      { msg },
      Sentry.Severity.Warning,
    );
    console.warn(`OpenWPM WARN log message: ${msg}`);
    await this.navigationBatchPreprocessor.submitOpenWPMPayload(
      "openwpm_log",
      logEntry,
    );
  };

  logError = async msg => {
    if (!this.active) {
      return;
    }
    if (await privateBrowsingActive()) {
      return;
    }
    const level = "error";
    const logEntry: LogEntry = { level, msg };
    captureExceptionWithExtras(new Error("OpenWPM ERROR log message"), { msg });
    console.error(`OpenWPM ERROR log message: ${msg}`);
    await this.navigationBatchPreprocessor.submitOpenWPMPayload(
      "openwpm_log",
      logEntry,
    );
  };

  logCritical = async msg => {
    if (!this.active) {
      return;
    }
    if (await privateBrowsingActive()) {
      return;
    }
    const level = "critical";
    const logEntry: LogEntry = { level, msg };
    captureExceptionWithExtras(new Error("OpenWPM CRITICAL log message"), {
      msg,
    });
    console.error(`OpenWPM CRITICAL log message: ${msg}`);
    await this.navigationBatchPreprocessor.submitOpenWPMPayload(
      "openwpm_log",
      logEntry,
    );
  };

  saveRecord = async (instrument, record) => {
    if (!this.active) {
      return;
    }
    if (
      (instrument !== "javascript_cookies" && record.incognito !== 0) ||
      (await privateBrowsingActive())
    ) {
      return;
    }

    const accepted = this.acceptPacket(instrument, record);
    console.info(
      `OpenWPM ${instrument} instrumentation package received and ${
        accepted ? "accepted" : "rejected"
      }`,
    );

    // Only keep relevant packages
    if (!accepted) {
      return;
    }

    await this.navigationBatchPreprocessor.submitOpenWPMPayload(
      instrument,
      record,
    );
  };

  saveContent = async (content, contentHash, httpResponse: HttpResponse) => {
    if (!this.active) {
      return;
    }
    if (await privateBrowsingActive()) {
      return;
    }
    console.info(
      `OpenWPM saveContent packet of approximate size ${humanFileSize(
        content.length,
      )} received. Hash: ${contentHash}`,
    );
    // Only keep relevant packages
    if (!this.acceptPacket("http_responses", httpResponse)) {
      console.info(`OpenWPM saved content dropped`);
      return;
    }
    /**
     * To make life easier for us, we decode the captured content and
     * add properties that allow the captured content batched by navigation.
     *
     * (Captured content comes as a separate "bare" payloads rather than attached to the http response payloads,
     * which only references them via the content hash. This allows for easy de-duplication at the storage level.)
     */
    const capturedContent: CapturedContent = {
      decoded_content: new TextDecoder("utf-8").decode(content),
      content_hash: contentHash,
      extension_session_uuid: httpResponse.extension_session_uuid,
      window_id: httpResponse.window_id,
      tab_id: httpResponse.tab_id,
      frame_id: httpResponse.frame_id,
      event_ordinal: httpResponse.event_ordinal,
      time_stamp: httpResponse.time_stamp,
    };
    await this.navigationBatchPreprocessor.submitOpenWPMPayload(
      "openwpm_captured_content",
      capturedContent,
    );
  };

  /**
   * For filtering operations that can't be set up via configuration.
   *
   * @param instrument
   * @param record
   */
  acceptPacket = (instrument, record) => {
    if (instrument === "navigations") {
      return record.frame_id === 0;
    }
    if (instrument === "http_responses" || instrument === "http_requests") {
      const { url } = record;
      const urlType = classifyYouTubeNavigationUrlType(url);
      if (
        urlType === "misc_xhr" ||
        urlType === "other" ||
        urlType === "prefetch" ||
        urlType === "search_results_page_load_more_results"
      ) {
        return false;
      }
      if (
        urlType === "watch_page" ||
        urlType === "user_page" ||
        urlType === "channel_page" ||
        urlType === "search_results_page" ||
        urlType === "youtube_main_page"
      ) {
        return true;
      }
      if (urlType === "unknown") {
        // Anonymously report unknown urls to be able to classify urls better
        // as the YouTube API / protocol changes over time
        const parsedUrl = new URL(url);
        captureExceptionWithExtras(
          new Error("Encountered an unknown YouTube URL"),
          { host: parsedUrl.host, pathname: parsedUrl.pathname },
        );
        console.warn("Encountered an unknown YouTube URL", {
          url,
          host: parsedUrl.host,
          pathname: parsedUrl.pathname,
        });
      }
      return false;
    }
    if (instrument === "ui_interactions") {
      return record.frame_id === 0;
    }
    if (instrument === "ui_states") {
      const uiState: UiState = record;
      return uiState.frame_id === 0 && uiState.document_hidden === 0;
    }
    if (instrument === "http_redirects") {
      return false;
    }
    captureExceptionWithExtras(
      new Error("Unhandled OpenWPM packet encountered in acceptPacket()"),
      { instrument, record },
    );
    console.warn("Unhandled OpenWPM packet encountered in acceptPacket()", {
      instrument,
      record,
    });
    return false;
  };

  pause = () => {
    this.active = false;
  };

  resume = () => {
    this.active = true;
  };
}

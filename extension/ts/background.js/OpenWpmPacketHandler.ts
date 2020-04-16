import { humanFileSize } from "./lib/humanFileSize";
import { ActiveTabDwellTimeMonitor } from "./ActiveTabDwellTimeMonitor";
import { NavigationBatchPreprocessor } from "./NavigationBatchPreprocessor";
import { HttpResponse } from "@openwpm/webext-instrumentation";
import { browser } from "webextension-polyfill-ts";

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
  public activeTabDwellTimeMonitor: ActiveTabDwellTimeMonitor;
  public navigationBatchPreprocessor: NavigationBatchPreprocessor;

  // To be able to pause and resume data collection
  public active = true;

  constructor() {
    // Setup active dwell time monitor singleton
    // (used to annotate received tab-relevant data packets)
    this.activeTabDwellTimeMonitor = new ActiveTabDwellTimeMonitor();

    // Setup study payload processor singleton
    this.navigationBatchPreprocessor = new NavigationBatchPreprocessor();
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
    console.log(`OpenWPM INFO log message: ${msg}`);
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

    // Annotate tab active dwell time
    let tabActiveDwellTime;
    if (record.tab_id > 0) {
      tabActiveDwellTime = this.activeTabDwellTimeMonitor.getTabActiveDwellTime(
        record.tab_id,
      );
    }
    await this.navigationBatchPreprocessor.submitOpenWPMPayload(
      instrument,
      record,
      tabActiveDwellTime,
    );
  };

  saveContent = async (content, contentHash, httpResponse: HttpResponse) => {
    if (!this.active) {
      return;
    }
    if (await privateBrowsingActive()) {
      return;
    }
    console.log(
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
      const mayNotStartWiths = [
        "https://www.youtube.com/comment_service_ajax",
        "https://www.youtube.com/youtubei/v1/log_event",
        "https://www.youtube.com/get_video_info",
        "https://www.youtube.com/get_midroll_info",
        "https://www.youtube.com/api/stats",
        "https://www.youtube.com/youtubei/v1/guide",
        "https://www.youtube.com/youtubei/v1/feedback",
        "https://www.youtube.com/youtubei/v1/related_ajax",
        "https://www.youtube.com/error_204",
      ];
      for (const mayNotStartWith of mayNotStartWiths) {
        if (record.url.indexOf(mayNotStartWith) === 0) {
          return false;
        }
      }
      const shouldStartWiths = [
        "https://www.youtube.com/watch",
        "https://www.youtube.com/channel",
        "https://www.youtube.com/results?search",
      ];
      for (const shouldStartWith of shouldStartWiths) {
        if (record.url.indexOf(shouldStartWith) === 0) {
          return true;
        }
      }
      if (record.url === "https://www.youtube.com/") {
        return true;
      }
    }
    if (instrument === "user_interactions") {
      return record.frame_id === 0;
    }
    console.log("TODO Keep this packet?", { instrument, record });
    return false;
  };

  pause = () => {
    this.active = false;
  };

  resume = () => {
    this.active = true;
  };
}

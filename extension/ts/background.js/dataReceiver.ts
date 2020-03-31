import { humanFileSize } from "./humanFileSize";
import { ActiveTabDwellTimeMonitor } from "./ActiveTabDwellTimeMonitor";
import { NavigationBatchPreprocessor } from "./NavigationBatchPreprocessor";
import { HttpResponse } from "@openwpm/webext-instrumentation";

// Export active dwell time monitor singleton
// (used to annotate received tab-relevant data packets)
export const activeTabDwellTimeMonitor = new ActiveTabDwellTimeMonitor();

// Setup study payload processor singleton
export const navigationBatchPreprocessor = new NavigationBatchPreprocessor();

// To be able to pause and resume data collection
let active = true;

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

export const logDebug = async function(msg) {
  if (!active) {
    return;
  }
  if (await privateBrowsingActive()) {
    return;
  }
  console.debug(`OpenWPM DEBUG log message: ${msg}`);
};

export const logInfo = async function(msg) {
  if (!active) {
    return;
  }
  if (await privateBrowsingActive()) {
    return;
  }
  const level = "info";
  const logEntry: LogEntry = { level, msg };
  console.log(`OpenWPM INFO log message: ${msg}`);
  await navigationBatchPreprocessor.submitOpenWPMPayload(
    "openwpm_log",
    logEntry,
  );
};

export const logWarn = async function(msg) {
  if (!active) {
    return;
  }
  if (await privateBrowsingActive()) {
    return;
  }
  const level = "warn";
  const logEntry: LogEntry = { level, msg };
  console.warn(`OpenWPM WARN log message: ${msg}`);
  await navigationBatchPreprocessor.submitOpenWPMPayload(
    "openwpm_log",
    logEntry,
  );
};

export const logError = async function(msg) {
  if (!active) {
    return;
  }
  if (await privateBrowsingActive()) {
    return;
  }
  const level = "error";
  const logEntry: LogEntry = { level, msg };
  console.error(`OpenWPM ERROR log message: ${msg}`);
  await navigationBatchPreprocessor.submitOpenWPMPayload(
    "openwpm_log",
    logEntry,
  );
};

export const logCritical = async function(msg) {
  if (!active) {
    return;
  }
  if (await privateBrowsingActive()) {
    return;
  }
  const level = "critical";
  const logEntry: LogEntry = { level, msg };
  console.error(`OpenWPM CRITICAL log message: ${msg}`);
  await navigationBatchPreprocessor.submitOpenWPMPayload(
    "openwpm_log",
    logEntry,
  );
};

export const saveRecord = async function(instrument, record) {
  if (!active) {
    return;
  }
  if (
    (instrument !== "javascript_cookies" && record.incognito !== 0) ||
    (await privateBrowsingActive())
  ) {
    return;
  }
  console.info(`OpenWPM ${instrument} instrumentation package received`);
  // Annotate tab active dwell time
  let tabActiveDwellTime;
  if (record.tab_id > 0) {
    tabActiveDwellTime = activeTabDwellTimeMonitor.getTabActiveDwellTime(
      record.tab_id,
    );
  }
  await navigationBatchPreprocessor.submitOpenWPMPayload(
    instrument,
    record,
    tabActiveDwellTime,
  );
};

export const saveContent = async function(
  content,
  contentHash,
  httpResponse: HttpResponse,
) {
  if (!active) {
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
  await navigationBatchPreprocessor.submitOpenWPMPayload(
    "openwpm_captured_content",
    capturedContent,
  );
};

export const pause = function() {
  active = false;
};

export const resume = function() {
  active = true;
};

import { humanFileSize } from "./humanFileSize";
import { ActiveTabDwellTimeMonitor } from "./ActiveTabDwellTimeMonitor";
import { StudyPayloadPreprocessor } from "./StudyPayloadPreprocessor";
import { TelemetrySender } from "./TelemetrySender";

// Export active dwell time monitor singleton
// (used to annotate received tab-relevant data packets)
export const activeTabDwellTimeMonitor = new ActiveTabDwellTimeMonitor();

// Setup study payload processor singleton
export const studyPayloadPreprocessor = new StudyPayloadPreprocessor();

// Setup telemetry sender singleton
const telemetrySender = new TelemetrySender(studyPayloadPreprocessor);

// To be able to pause and resume data collection
let active = true;

export interface LogEntry {
  level: string;
  msg: string;
}

export interface CapturedContent {
  content: string;
  contentHash: string;
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
  await telemetrySender.submitOpenWPMPayload("openwpm_log", logEntry);
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
  await telemetrySender.submitOpenWPMPayload("openwpm_log", logEntry);
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
  await telemetrySender.submitOpenWPMPayload("openwpm_log", logEntry);
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
  await telemetrySender.submitOpenWPMPayload("openwpm_log", logEntry);
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
  await telemetrySender.submitOpenWPMPayload(
    instrument,
    record,
    tabActiveDwellTime,
  );
};

export const saveContent = async function(content, contentHash) {
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
  const capturedContent: CapturedContent = {
    content,
    contentHash,
  };
  await telemetrySender.submitOpenWPMPayload(
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

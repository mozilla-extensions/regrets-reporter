import { RegretReport } from "./ReportSummarizer";
import { makeUUID } from "./lib/uuid";
import { YouTubeUsageStatisticsUpdate } from "./YouTubeUsageStatistics";
import { Store } from "./Store";
import { TelemetryClient } from "./TelemetryClient";
import { browser } from "webextension-polyfill-ts";
import { getChromiumBrowserInfo } from "./lib/getChromiumBrowserInfo";

// The `browser` global object can't be set via the global object in test/browser-polyfills.ts
// thus, it sets globalThis.browser instead, which we have to move to `browser` during tests.
// TL;DR: This is necessary for the unit tests to run
if (!browser.runtime) {
  // @ts-ignore
  // noinspection JSConstantReassignment
  browser = globalThis.browser;
}

export interface SharedDataEventMetadata {
  client_timestamp: string;
  extension_installation_uuid: string;
  event_uuid: string;
  total_amount_of_regret_reports: number;
  browser_info: {
    build_id: string;
    name: string;
    vendor: string;
    version: string;
  };
  extension_version: string;
}

export interface SharedData {
  regret_report?: RegretReport;
  youtube_usage_statistics_update?: YouTubeUsageStatisticsUpdate;
}

export interface AnnotatedSharedData extends SharedData {
  event_metadata: SharedDataEventMetadata;
}

export class DataSharer {
  public store: Store;
  public telemetryClient: TelemetryClient;

  constructor(store) {
    this.store = store;
    this.telemetryClient = new TelemetryClient(store);
  }

  async annotateSharedData(
    data: SharedData,
    total_amount_of_regret_reports,
  ): Promise<AnnotatedSharedData> {
    const browserInfo = browser.runtime.getBrowserInfo
      ? await browser.runtime.getBrowserInfo()
      : getChromiumBrowserInfo();
    const extensionPreferences = await this.store.getExtensionPreferences();

    return {
      ...data,
      event_metadata: {
        client_timestamp: new Date().toISOString(),
        extension_installation_uuid:
          extensionPreferences.extensionInstallationUuid,
        event_uuid: makeUUID(),
        total_amount_of_regret_reports,
        browser_info: {
          build_id: browserInfo.buildID,
          vendor: browserInfo.vendor,
          version: browserInfo.version,
          name: browserInfo.name,
        },
        extension_version: browser.runtime.getManifest().version,
      },
    };
  }

  async share(data: SharedData) {
    const { sharedData } = await this.store.get("sharedData");

    const countsAsRegretReport = ($annotatedData: SharedData) =>
      $annotatedData.regret_report &&
      $annotatedData.regret_report.form_step !== 2;

    let total_amount_of_regret_reports = sharedData
      ? sharedData.filter(countsAsRegretReport).length
      : 0;

    // If this is a regret report, include it in the statistic
    if (countsAsRegretReport(data)) {
      total_amount_of_regret_reports++;
    }

    const annotatedData: AnnotatedSharedData = await this.annotateSharedData(
      data,
      total_amount_of_regret_reports,
    );

    // Store a copy of the data for local introspection
    if (sharedData) {
      sharedData.push(annotatedData);
      await this.store.set({ sharedData });
    } else {
      await this.store.set({
        sharedData: [annotatedData],
      });
    }

    // Queue for external upload
    await this.telemetryClient.submitPayload(annotatedData);
  }

  async export() {
    const { sharedData } = await this.store.get("sharedData");
    return sharedData || [];
  }
}

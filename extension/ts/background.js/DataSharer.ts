import { RegretReport } from "./ReportSummarizer";
import { makeUUID } from "./lib/uuid";
import { YouTubeUsageStatisticsUpdate } from "./YouTubeUsageStatistics";
import { ConsentStatus, Store, UserSuppliedDemographics } from "./Store";
import { browser } from "webextension-polyfill-ts";
import { TelemetryClient } from "./TelemetryClient";

export interface SharedDataEventMetadata {
  client_timestamp: string;
  extension_installation_uuid: string;
  event_uuid: string;
  user_supplied_demographics: UserSuppliedDemographics;
  amount_of_regret_reports_since_consent_was_given: number;
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
  data_sharing_consent_update?: {
    consent_status: ConsentStatus;
    consent_status_timestamp: string;
  };
}

export interface AnnotatedSharedData extends SharedData {
  event_metadata: SharedDataEventMetadata;
}

export class DataSharer {
  public store: Store;
  public telemetryClient: TelemetryClient;

  constructor(store) {
    this.store = store;
    this.telemetryClient = new TelemetryClient();
  }

  async share(data: SharedData) {
    const { sharedData } = await this.store.get("sharedData");

    let amount_of_regret_reports_since_consent_was_given = sharedData
      ? sharedData.filter($annotatedData => $annotatedData.regretReport).length
      : 0;

    // If this is a regret report, include it in the statistic
    if (data.regret_report) {
      amount_of_regret_reports_since_consent_was_given++;
    }

    const browserInfo = await browser.runtime.getBrowserInfo();

    const annotatedData: AnnotatedSharedData = {
      ...data,
      event_metadata: {
        client_timestamp: new Date().toISOString(),
        extension_installation_uuid: await this.store.extensionInstallationUuid(),
        event_uuid: makeUUID(),
        user_supplied_demographics: await this.store.getUserSuppliedDemographics(),
        amount_of_regret_reports_since_consent_was_given,
        browser_info: {
          build_id: browserInfo.buildID,
          vendor: browserInfo.vendor,
          version: browserInfo.version,
          name: browserInfo.name,
        },
        extension_version: browser.runtime.getManifest().version,
      },
    };

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
    await this.telemetryClient.submitPayload(
      "regrets-reporter-payload",
      annotatedData,
    );
  }

  async export() {
    const { sharedData } = await this.store.get("sharedData");
    return sharedData || [];
  }
}

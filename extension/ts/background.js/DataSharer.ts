import { RegretReport } from "./ReportSummarizer";
import { makeUUID } from "./lib/uuid";
import { YouTubeUsageStatisticsUpdate } from "./YouTubeUsageStatistics";
import { Store, UserSuppliedDemographics } from "./Store";
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
  user_supplied_demographics_update?: {
    user_supplied_demographics: UserSuppliedDemographics;
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

  async annotateSharedData(
    data: SharedData,
    amount_of_regret_reports_since_consent_was_given,
  ): Promise<AnnotatedSharedData> {
    const browserInfo = await globalThis.browser.runtime.getBrowserInfo();

    return {
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
        extension_version: globalThis.browser.runtime.getManifest().version,
      },
    };
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

    const annotatedData: AnnotatedSharedData = await this.annotateSharedData(
      data,
      amount_of_regret_reports_since_consent_was_given,
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

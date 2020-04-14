import { RegretReport } from "./ReportSummarizer";
import { makeUUID } from "./lib/uuid";
import { YouTubeUsageStatisticsUpdate } from "./YouTubeUsageStatistics";
import { ConsentStatus, Store, UserSuppliedDemographics } from "./Store";

export interface SharedDataEventMetadata {
  client_timestamp: string;
  extension_installation_uuid: string;
  event_uuid: string;
  user_supplied_demographics: UserSuppliedDemographics;
  amount_of_regret_reports_since_consent_was_given: number;
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
  constructor(store) {
    this.store = store;
  }

  async share(data: SharedData) {
    const { sharedData } = await this.store.get("sharedData");

    const amount_of_regret_reports_since_consent_was_given = sharedData
      ? sharedData.filter($annotatedData => $annotatedData.regretReport).length
      : 0;

    const annotatedData: AnnotatedSharedData = {
      ...data,
      event_metadata: {
        client_timestamp: new Date().toISOString(),
        extension_installation_uuid: await this.store.extensionInstallationUuid(),
        event_uuid: makeUUID(),
        user_supplied_demographics: await this.store.getUserSuppliedDemographics(),
        amount_of_regret_reports_since_consent_was_given,
        extension_version: browser.runtime.getManifest().version,
      },
    };

    if (sharedData) {
      sharedData.push(annotatedData);
      await this.store.set({ sharedData });
    } else {
      await this.store.set({
        sharedData: [annotatedData],
      });
    }
  }

  async export() {
    const { sharedData } = await this.store.get("sharedData");
    return sharedData || [];
  }
}

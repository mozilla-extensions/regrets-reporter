import {
  getUserSuppliedDemographics,
  UserSuppliedDemographics,
} from "./lib/userSuppliedDemographics";
import { browser } from "webextension-polyfill-ts";
import { RegretReport } from "./ReportSummarizer";
import { extensionInstallationUuid } from "./lib/extensionInstallationUuid";
import { makeUUID } from "./lib/uuid";
import { YouTubeUsageStatisticsUpdate } from "./YouTubeUsageStatistics";

export interface SharedDataEventMetadata {
  client_timestamp: string;
  extension_installation_uuid: string;
  event_uuid: string;
  user_supplied_demographics: UserSuppliedDemographics;
  amount_of_regret_reports_since_consent_was_given: number;
}

export interface SharedData {
  regretReport?: RegretReport;
  youTubeUsageStatisticsUpdate?: YouTubeUsageStatisticsUpdate;
}

export interface AnnotatedSharedData extends SharedData {
  event_metadata: SharedDataEventMetadata;
}

export class DataSharer {
  async share(data: SharedData) {
    const { sharedData } = await browser.storage.local.get("sharedData");

    const amount_of_regret_reports_since_consent_was_given = sharedData.filter(
      $annotatedData => annotatedData.regretReport,
    ).length;

    const annotatedData: AnnotatedSharedData = {
      ...data,
      event_metadata: {
        client_timestamp: new Date().toISOString(),
        extension_installation_uuid: await extensionInstallationUuid(),
        event_uuid: makeUUID(),
        user_supplied_demographics: await getUserSuppliedDemographics(),
        amount_of_regret_reports_since_consent_was_given,
      },
    };

    if (sharedData) {
      sharedData.push(annotatedData);
      await browser.storage.local.set({ sharedData });
    } else {
      await browser.storage.local.set({
        sharedData: [annotatedData],
      });
    }
  }

  async export() {
    const { sharedData } = await browser.storage.local.get("sharedData");
    return sharedData;
  }
}

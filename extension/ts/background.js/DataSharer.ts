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
    const annotatedData: AnnotatedSharedData = {
      ...data,
      event_metadata: {
        client_timestamp: new Date().toISOString(),
        extension_installation_uuid: await extensionInstallationUuid(),
        event_uuid: makeUUID(),
        user_supplied_demographics: await getUserSuppliedDemographics(),
      },
    };

    const { sharedData } = await browser.storage.local.get("sharedData");
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

import { RegretReport } from "./ReportSummarizer";
import { makeUUID } from "./lib/uuid";
import { YouTubeUsageStatisticsUpdate } from "./YouTubeUsageStatistics";
import { Store } from "./Store";
import { TelemetryClient } from "./TelemetryClient";
import { browser } from "webextension-polyfill-ts";

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
  extension_version: string;
}

interface DataDeletionRequest {
  extension_installation_uuid: string;
  extension_installation_error_reporting_uuid: string;
}

export interface SharedData {
  regret_report?: RegretReport;
  youtube_usage_statistics_update?: YouTubeUsageStatisticsUpdate;
  data_deletion_request?: DataDeletionRequest;
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

  async annotateSharedData(data: SharedData): Promise<AnnotatedSharedData> {
    const extensionPreferences = await this.store.getExtensionPreferences();

    return {
      ...data,
      event_metadata: {
        client_timestamp: new Date().toISOString(),
        extension_installation_uuid:
          extensionPreferences.extensionInstallationUuid,
        event_uuid: makeUUID(),
        extension_version: browser.runtime.getManifest().version,
      },
    };
  }

  async share(data: SharedData) {
    const { sharedData } = await this.store.get("sharedData");

    const annotatedData: AnnotatedSharedData = await this.annotateSharedData(
      data,
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

  async requestDataDeletion() {
    const extensionPreferences = await this.store.getExtensionPreferences();
    await this.share({
      data_deletion_request: {
        extension_installation_uuid:
          extensionPreferences.extensionInstallationUuid,
        extension_installation_error_reporting_uuid:
          extensionPreferences.extensionInstallationErrorReportingUuid,
      },
    });
  }

  async export(): Promise<AnnotatedSharedData[]> {
    const { sharedData } = await this.store.get("sharedData");
    return sharedData || [];
  }
}

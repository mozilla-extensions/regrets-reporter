import { browser, Storage } from "webextension-polyfill-ts";
import StorageArea = Storage.StorageArea;
import StorageAreaSetItemsType = Storage.StorageAreaSetItemsType;
import { makeUUID } from "./lib/uuid";

export interface LocalStorageWrapper {
  get: StorageArea["get"];
  set: StorageArea["set"];
}

export interface ExtensionPreferences {
  enableErrorReporting: boolean;
  hidePrivacySummaryBanner: boolean;
  extensionInstallationErrorReportingUuid: string;
  extensionInstallationUuid: string;
  extensionVersion: string;
}

export class Store implements LocalStorageWrapper {
  public localStorageWrapper: LocalStorageWrapper;
  constructor(localStorageWrapper) {
    this.get = localStorageWrapper.get;
    this.set = localStorageWrapper.set;
  }
  get = async (
    keys?:
      | null
      | string
      | string[]
      | {
          [s: string]: any;
        },
  ): Promise<{
    [s: string]: any;
  }> => ({});
  set = async (items: StorageAreaSetItemsType): Promise<void> => {};

  initialExtensionPreferences = async (): Promise<ExtensionPreferences> => {
    return {
      enableErrorReporting: true,
      hidePrivacySummaryBanner: false,
      extensionInstallationErrorReportingUuid: "",
      extensionInstallationUuid: "",
      extensionVersion: "",
    };
  };

  /**
   * Returns a persistent unique identifier of the extension installation
   * sent with each report. Not related to the Firefox client id
   */
  extensionInstallationUuid = async () => {
    const { extensionInstallationUuid } = await this.get(
      "extensionInstallationUuid",
    );
    if (extensionInstallationUuid) {
      return extensionInstallationUuid;
    }
    const generatedUuid = makeUUID();
    await this.set({ extensionInstallationUuid: generatedUuid });
    return generatedUuid;
  };

  /**
   * Returns a persistent unique identifier of the extension installation
   * sent with each error report. Not related to the Firefox client id
   * nor the extension installation uuid that identifies shared data.
   */
  extensionInstallationErrorReportingUuid = async () => {
    const { extensionInstallationErrorReportingUuid } = await this.get(
      "extensionInstallationErrorReportingUuid",
    );
    if (extensionInstallationErrorReportingUuid) {
      return extensionInstallationErrorReportingUuid;
    }
    const generatedUuid = makeUUID();
    await this.set({ extensionInstallationErrorReportingUuid: generatedUuid });
    return generatedUuid;
  };

  getExtensionPreferences = async (): Promise<ExtensionPreferences> => {
    const { extensionPreferences } = await this.get("extensionPreferences");
    return {
      ...(await this.initialExtensionPreferences()),
      ...extensionPreferences,
      ...{
        // The following are not editable extension preferences, but attributes
        // that we want to display on the extension preferences dialog and/or
        // add as context in error reports
        extensionInstallationErrorReportingUuid: await this.extensionInstallationErrorReportingUuid(),
        extensionInstallationUuid: await this.extensionInstallationUuid(),
        extensionVersion: browser.runtime.getManifest().version,
      },
    };
  };

  setExtensionPreferences = async (
    extensionPreferences: ExtensionPreferences,
  ) => {
    await this.set({ extensionPreferences });
  };
}

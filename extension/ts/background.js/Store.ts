import { Storage } from "webextension-polyfill-ts";
import StorageArea = Storage.StorageArea;
import StorageAreaSetItemsType = Storage.StorageAreaSetItemsType;
import { makeUUID } from "./lib/uuid";

export interface LocalStorageWrapper {
  get: StorageArea["get"];
  set: StorageArea["set"];
}

export interface UserSuppliedDemographics {
  dem_age: null | string;
  dem_gender: null | "man" | "women" | "other-description";
  dem_gender_descr: null | string;
  last_updated: null | string;
}

export type ConsentStatus = null | "given" | "withdrawn";

export interface ExtensionPreferences {
  enableErrorReporting: boolean;
}

export const defaultExtensionPreferences = {
  enableErrorReporting: true,
};

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

  getExtensionPreferences = async (): Promise<ExtensionPreferences> => {
    const { extensionPreferences } = await this.get("extensionPreferences");
    return {
      ...defaultExtensionPreferences,
      ...extensionPreferences,
    };
  };

  setExtensionPreferences = async (
    extensionPreferences: ExtensionPreferences,
  ) => {
    await this.set({ extensionPreferences });
  };

  getUserSuppliedDemographics = async (): Promise<UserSuppliedDemographics> => {
    const { userSuppliedDemographics } = await this.get(
      "userSuppliedDemographics",
    );
    return (
      userSuppliedDemographics || {
        dem_age: null,
        dem_gender: null,
        dem_gender_descr: null,
        last_updated: null,
      }
    );
  };

  setUserSuppliedDemographics = async (
    userSuppliedDemographics: UserSuppliedDemographics,
  ) => {
    await this.set({ userSuppliedDemographics });
  };
}

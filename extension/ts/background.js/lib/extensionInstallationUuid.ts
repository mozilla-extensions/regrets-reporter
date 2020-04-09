import { browser } from "webextension-polyfill-ts";
import { makeUUID } from "./uuid";

/**
 * Returns a persistent unique identifier of the extension installation
 * sent with each report. Not related to the Firefox client id
 */
export const extensionInstallationUuid = async () => {
  const { extensionInstallationUuid } = await browser.storage.local.get(
    "extensionInstallationUuid",
  );
  if (extensionInstallationUuid) {
    return extensionInstallationUuid;
  }
  const generatedUuid = makeUUID();
  await browser.storage.local.set({ extensionInstallationUuid: generatedUuid });
  return generatedUuid;
};

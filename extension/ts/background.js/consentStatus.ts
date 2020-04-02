import { browser } from "webextension-polyfill-ts";

export type ConsentStatus = null | "given" | "withdrawn";

export const getConsentStatus = async (): Promise<ConsentStatus> => {
  const { consentStatus } = await browser.storage.local.get("consentStatus");
  return consentStatus;
};

export const setConsentStatus = async (consentStatus: ConsentStatus) => {
  const consentChangeTimestamp = new Date().toISOString();
  await browser.storage.local.set({ consentStatus, consentChangeTimestamp });
};

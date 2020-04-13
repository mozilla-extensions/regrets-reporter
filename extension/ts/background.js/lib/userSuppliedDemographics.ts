import { browser } from "webextension-polyfill-ts";

export interface UserSuppliedDemographics {
  userPartOfMarginilizedGroup: null | "yes" | "no" | "prefer-not-to-answer";
  userOver18: null | "yes" | "no";
}

export const getUserSuppliedDemographics = async (): Promise<UserSuppliedDemographics> => {
  const { userSuppliedDemographics } = await browser.storage.local.get(
    "userSuppliedDemographics",
  );
  return userSuppliedDemographics;
};

export const setUserSuppliedDemographics = async (
  userSuppliedDemographics: UserSuppliedDemographics,
) => {
  await browser.storage.local.set({ userSuppliedDemographics });
};

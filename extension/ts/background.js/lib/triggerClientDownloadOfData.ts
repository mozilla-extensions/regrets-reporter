import { browser } from "webextension-polyfill-ts";

export const triggerClientDownloadOfData = async (data, filename) => {
  const json = JSON.stringify(data);
  const blob = new Blob([json], {
    type: "application/json;charset=utf-8",
  });
  await browser.downloads.download({
    url: URL.createObjectURL(blob),
    filename,
  });
};

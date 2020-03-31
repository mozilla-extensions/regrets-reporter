/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(feature)" }]*/
/* global getOpenwpmConfig */

("use strict");

import { browser } from "webextension-polyfill-ts";
import * as dataReceiver from "./dataReceiver";
import {
  CookieInstrument,
  JavascriptInstrument,
  HttpInstrument,
  NavigationInstrument,
} from "@openwpm/webext-instrumentation";

const triggerClientDownloadOfData = async (data, filename) => {
  const json = JSON.stringify(data);
  const blob = new Blob([json], {
    type: "application/json;charset=utf-8",
  });
  await browser.downloads.download({
    url: URL.createObjectURL(blob),
    filename,
  });
};

class Feature {
  private navigationInstrument;
  private cookieInstrument;
  private jsInstrument;
  private httpInstrument;
  private openwpmCrawlId;

  constructor() {}

  async init() {
    const feature = this;

    // TODO: "Client ID"
    // For A1: A unique identifier of the user or browser such as telemetry client_id is sent with each report.

    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (
        tab.url.match(
          /:\/\/[^\/]*\.?(youtube.com|youtu.be|youtube-nocookies.com)\/watch/,
        )
      ) {
        browser.pageAction.show(tab.id);
      } else {
        browser.pageAction.hide(tab.id);
      }
    });

    const exportSeenTelementry = async () => {
      console.debug("Exporting seen events");
      const { seenEvents } = await browser.storage.local.get("seenEvents");
      await triggerClientDownloadOfData(seenEvents, "seenEvents.json");
    };

    browser.browserAction.onClicked.addListener(exportSeenTelementry);

    // tmp code
    const reportRegret = async () => {
      const regretEvent = { regret: "foo" };

      const { seenEvents } = await browser.storage.local.get("seenEvents");
      if (seenEvents) {
        seenEvents.push(regretEvent);
        await browser.storage.local.set({ seenEvents });
      } else {
        await browser.storage.local.set({ seenEvents: [regretEvent] });
      }
      console.log("Regret reported");
    };

    browser.pageAction.onClicked.addListener(reportRegret);

    // Start OpenWPM instrumentation
    const openwpmConfig = {
      navigation_instrument: true,
      cookie_instrument: false,
      js_instrument: false,
      http_instrument: true,
      save_content: "main_frame,xmlhttprequest",
      http_instrument_resource_types: "main_frame,xmlhttprequest",
      http_instrument_urls:
        "*://*.youtube.com/*|*://*.youtu.be/*|*://*.youtube-nocookie.com/*",
      crawl_id: 0,
    };
    await this.startOpenWPMInstrumentation(openwpmConfig);
  }

  async startOpenWPMInstrumentation(config) {
    dataReceiver.activeTabDwellTimeMonitor.run();
    dataReceiver.navigationBatchPreprocessor.run();
    this.openwpmCrawlId = config["crawl_id"];
    if (config["navigation_instrument"]) {
      dataReceiver.logDebug("Navigation instrumentation enabled");
      this.navigationInstrument = new NavigationInstrument(dataReceiver);
      this.navigationInstrument.run(config["crawl_id"]);
    }
    if (config["cookie_instrument"]) {
      dataReceiver.logDebug("Cookie instrumentation enabled");
      this.cookieInstrument = new CookieInstrument(dataReceiver);
      this.cookieInstrument.run(config["crawl_id"]);
    }
    if (config["js_instrument"]) {
      dataReceiver.logDebug("Javascript instrumentation enabled");
      this.jsInstrument = new JavascriptInstrument(dataReceiver);
      this.jsInstrument.run(config["crawl_id"]);
    }
    if (config["http_instrument"]) {
      dataReceiver.logDebug("HTTP Instrumentation enabled");
      this.httpInstrument = new HttpInstrument(dataReceiver);
      this.httpInstrument.run(
        config["crawl_id"],
        config["save_content"],
        config["http_instrument_resource_types"],
        config["http_instrument_urls"],
      );
    }
  }

  pause() {
    dataReceiver.pause();
    if (dataReceiver.activeTabDwellTimeMonitor) {
      dataReceiver.activeTabDwellTimeMonitor.cleanup();
    }
    if (dataReceiver.navigationBatchPreprocessor) {
      dataReceiver.navigationBatchPreprocessor.cleanup();
    }
  }

  resume() {
    dataReceiver.resume();
    if (dataReceiver.activeTabDwellTimeMonitor) {
      dataReceiver.activeTabDwellTimeMonitor.run();
    }
    if (dataReceiver.navigationBatchPreprocessor) {
      dataReceiver.navigationBatchPreprocessor.run();
    }
  }

  /**
   * Called at end of study, and if the user disables the study or it gets uninstalled by other means.
   */
  async cleanup() {
    if (this.navigationInstrument) {
      await this.navigationInstrument.cleanup();
    }
    if (this.cookieInstrument) {
      await this.cookieInstrument.cleanup();
    }
    if (this.jsInstrument) {
      await this.jsInstrument.cleanup();
    }
    if (this.httpInstrument) {
      await this.httpInstrument.cleanup();
    }
    if (dataReceiver.activeTabDwellTimeMonitor) {
      dataReceiver.activeTabDwellTimeMonitor.cleanup();
    }
    if (dataReceiver.navigationBatchPreprocessor) {
      dataReceiver.navigationBatchPreprocessor.cleanup();
    }
  }
}

// make an instance of the feature class available to the extension background context
const feature = ((window as any).feature = new Feature());

// make the dataReceiver singleton and triggerClientDownloadOfData available to
// the extension background context so that we as developers can collect fixture data
(window as any).dataReceiver = dataReceiver;
(window as any).triggerClientDownloadOfData = triggerClientDownloadOfData;

// init the feature on every extension load
async function onEveryExtensionLoad() {
  await feature.init();
}
onEveryExtensionLoad();

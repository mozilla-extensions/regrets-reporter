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

class Feature {
  private navigationInstrument;
  private cookieInstrument;
  private jsInstrument;
  private httpInstrument;
  private openwpmCrawlId;

  constructor() {}

  async configure() {
    const feature = this;

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
      const json = JSON.stringify(seenEvents);
      const blob = new Blob([json], {
        type: "application/json;charset=utf-8",
      });
      console.debug("foo");
      await browser.downloads.download({
        url: URL.createObjectURL(blob),
        filename: "seenEvents.json",
      });
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
      save_content: false,
      crawl_id: 0,
    };
    await this.startOpenWPMInstrumentation(openwpmConfig);
  }

  async startOpenWPMInstrumentation(config) {
    dataReceiver.activeTabDwellTimeMonitor.run();
    dataReceiver.studyPayloadPreprocessor.run();
    this.openwpmCrawlId = config["crawl_id"];
    if (config["navigation_instrument"]) {
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
      this.httpInstrument.run(config["crawl_id"], config["save_content"]);
    }
  }

  pause() {
    dataReceiver.pause();
    if (dataReceiver.activeTabDwellTimeMonitor) {
      dataReceiver.activeTabDwellTimeMonitor.cleanup();
    }
    if (dataReceiver.studyPayloadPreprocessor) {
      dataReceiver.studyPayloadPreprocessor.cleanup();
    }
  }

  resume() {
    dataReceiver.resume();
    if (dataReceiver.activeTabDwellTimeMonitor) {
      dataReceiver.activeTabDwellTimeMonitor.run();
    }
    if (dataReceiver.studyPayloadPreprocessor) {
      dataReceiver.studyPayloadPreprocessor.run();
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
    if (dataReceiver.studyPayloadPreprocessor) {
      dataReceiver.studyPayloadPreprocessor.cleanup();
    }
  }
}

// make an instance of the feature class available to background.js
(window as any).feature = new Feature();

/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(feature)" }]*/
/* global getOpenwpmConfig */

("use strict");

declare namespace browser.downloads {
  function download(options: any): any;
}

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

    // Start OpenWPM instrumentation
    const openwpmConfig = {
      navigation_instrument: true,
      cookie_instrument: true,
      js_instrument: false,
      http_instrument: true,
      save_content: false,
      crawl_id: 0,
    };
    await this.startOpenWPMInstrumentation(openwpmConfig);

    // Start Pioneer telemetry export helper
    /*
      console.debug("Will export seen telemetry in 10s");
      const exportSeenTelementry = async () => {
        console.debug("Exporting seen telemetry");
        const json = JSON.stringify(internals.seenTelemetry);
        const blob = new Blob([json], {
          type: "application/json;charset=utf-8",
        });
        console.debug("foo");
        browser.downloads.download({
          url: URL.createObjectURL(blob),
          filename: "seenTelemetry.json",
        });
      };
      // TODO: onNavigation to specific url instead of setTimeout
      setTimeout(exportSeenTelementry, 1000 * 10);
    */
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

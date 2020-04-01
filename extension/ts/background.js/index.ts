/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(extensionGlue)" }]*/

("use strict");

import { browser } from "webextension-polyfill-ts";
import * as dataReceiver from "./dataReceiver";
import {
  CookieInstrument,
  JavascriptInstrument,
  HttpInstrument,
  NavigationInstrument,
} from "@openwpm/webext-instrumentation";
import { ReportSummarizer } from "./ReportSummarizer";
import { extensionInstallationUuid } from "./extensionInstallationUuid";
import { triggerClientDownloadOfData } from "./triggerClientDownloadOfData";
const reportSummarizer = new ReportSummarizer();

class ExtensionGlue {
  private navigationInstrument;
  private cookieInstrument;
  private jsInstrument;
  private httpInstrument;
  private openwpmCrawlId;
  private contentScriptPortListener;

  constructor() {}

  async init() {
    // During prototype phase, we have a browser action button that allows for downloading the reported data
    const exportReportedRegrets = async () => {
      console.debug("Exporting reported regrets");
      const { reportedRegrets } = await browser.storage.local.get(
        "reportedRegrets",
      );
      await triggerClientDownloadOfData(
        reportedRegrets,
        `reportedRegrets-userUuid=${extensionInstallationUuid()}.json`,
      );
    };
    browser.browserAction.onClicked.addListener(exportReportedRegrets);

    // Only show report-regret page action on YouTube watch pages
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

    // Set up a connection / listener for content scripts to be able to query collected web traffic data
    let portFromContentScript;
    this.contentScriptPortListener = p => {
      // console.log("contentScriptPortListener set up");
      portFromContentScript = p;
      portFromContentScript.onMessage.addListener(async function(m) {
        if (m.reportedRegret) {
          const { reportedRegret } = m;
          const { reportedRegrets } = await browser.storage.local.get(
            "reportedRegrets",
          );
          // Store the reported regret
          if (reportedRegrets) {
            reportedRegrets.push(reportedRegret);
            await browser.storage.local.set({ reportedRegrets });
          } else {
            await browser.storage.local.set({
              reportedRegrets: [reportedRegret],
            });
          }
          console.log("Reported regret stored");
        }
        // The report form has triggered a report-related data collection
        if (m.requestReportData) {
          await dataReceiver.navigationBatchPreprocessor.processQueue();
          const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
            dataReceiver.navigationBatchPreprocessor
              .navigationBatchesByNavigationUuid,
          );
          portFromContentScript.postMessage({
            reportData: { youTubeNavigation: youTubeNavigations[0] },
          });
        }
      });
    };
    browser.runtime.onConnect.addListener(this.contentScriptPortListener);

    // Start OpenWPM instrumentation (monitors navigations and http content)
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
    if (this.contentScriptPortListener) {
      browser.runtime.onMessage.removeListener(this.contentScriptPortListener);
    }
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
      await dataReceiver.navigationBatchPreprocessor.cleanup();
    }
  }
}

// make an instance of the ExtensionGlue class available to the extension background context
const extensionGlue = ((window as any).extensionGlue = new ExtensionGlue());

// make the dataReceiver singleton and triggerClientDownloadOfData available to
// the extension background context so that we as developers can collect fixture data
(window as any).dataReceiver = dataReceiver;
(window as any).triggerClientDownloadOfData = triggerClientDownloadOfData;

// init the extension glue on every extension load
async function onEveryExtensionLoad() {
  await extensionGlue.init();
}
onEveryExtensionLoad().then();

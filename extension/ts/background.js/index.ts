/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(extensionGlue)" }]*/

import { getConsentStatus, setConsentStatus } from "./lib/consentStatus";
import { browser } from "webextension-polyfill-ts";
import {
  CookieInstrument,
  JavascriptInstrument,
  HttpInstrument,
  NavigationInstrument,
} from "@openwpm/webext-instrumentation";
import { ReportSummarizer } from "./ReportSummarizer";
import { extensionInstallationUuid } from "./lib/extensionInstallationUuid";
import { triggerClientDownloadOfData } from "./lib/triggerClientDownloadOfData";
import { TrimmedNavigationBatch } from "./NavigationBatchPreprocessor";
import { YouTubeUsageStatisticsMonitor } from "./YouTubeUsageStatistics";
import { OpenWpmPacketHandler } from "./openWpmPacketHandler";
const openWpmPacketHandler = new OpenWpmPacketHandler();
const reportSummarizer = new ReportSummarizer();
const youTubeUsageStatisticsMonitor = new YouTubeUsageStatisticsMonitor();

class ExtensionGlue {
  private navigationInstrument;
  private cookieInstrument;
  private jsInstrument;
  private httpInstrument;
  private openwpmCrawlId;
  private contentScriptPortListener;

  constructor() {}

  async init() {
    // Set up a connection / listener for the consent-form script to be able to query consent status
    let portFromContentScript;
    this.contentScriptPortListener = p => {
      if (p.name !== "port-from-consent-form") {
        return;
      }
      console.log("Connected to consent-form script");
      portFromContentScript = p;
      portFromContentScript.onMessage.addListener(async function(m) {
        console.log("Message from consent-form script:", { m });
        if (m.requestConsentStatus) {
          portFromContentScript.postMessage({
            consentStatus: await getConsentStatus(),
          });
        }
        if (m.updatedConsentStatus) {
          await setConsentStatus(m.updatedConsentStatus);
          const consentGiven = (await getConsentStatus()) === "given";
          if (consentGiven) {
            console.log("Enrolled. Starting study");
            await extensionGlue.start();
          }
        }
      });
    };
    browser.runtime.onConnect.addListener(this.contentScriptPortListener);
  }

  async askForConsent() {
    // Open consent form
    const consentFormUrl = browser.runtime.getURL(
      `consent-form/consent-form.html`,
    );
    await browser.tabs.create({ url: consentFormUrl });
  }

  async start() {
    // During prototype phase, we have a browser action button that allows for downloading the reported data
    const exportReportedRegrets = async () => {
      console.debug("Exporting reported regrets");
      const { reportedRegrets } = await browser.storage.local.get(
        "reportedRegrets",
      );
      await triggerClientDownloadOfData(
        reportedRegrets,
        `reportedRegrets-userUuid=${await extensionInstallationUuid()}.json`,
      );
    };
    browser.browserAction.onClicked.addListener(exportReportedRegrets);

    // Only show report-regret page action on YouTube watch pages
    const showPageActionOnWatchPagesOnly = (tabId, changeInfo, tab) => {
      if (
        tab.url.match(
          /:\/\/[^\/]*\.?(youtube.com|youtu.be|youtube-nocookies.com)\/watch/,
        )
      ) {
        browser.pageAction.show(tab.id);
      } else {
        browser.pageAction.hide(tab.id);
      }
    };
    browser.tabs.onUpdated.addListener(showPageActionOnWatchPagesOnly);

    // Make the page action show on watch pages also in case extension is loaded/reloaded while on one
    const activeTabs = await browser.tabs.query({
      active: true,
    });
    if (activeTabs.length > 0) {
      const currentTab = activeTabs[0];
      showPageActionOnWatchPagesOnly(currentTab.id, null, currentTab);
    }

    // Set up a connection / listener for content scripts to be able to query collected web traffic data
    let portFromContentScript;
    this.contentScriptPortListener = p => {
      if (p.name !== "port-from-report-regret-form") {
        return;
      }
      portFromContentScript = p;
      portFromContentScript.onMessage.addListener(async function(m) {
        console.log("Message from report-regret-form script:", { m });
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
          await openWpmPacketHandler.navigationBatchPreprocessor.processQueue();
          const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
            openWpmPacketHandler.navigationBatchPreprocessor
              .navigationBatchesByNavigationUuid,
            await extensionInstallationUuid(),
          );
          console.log({ youTubeNavigations });
          portFromContentScript.postMessage({
            reportData: { youTubeNavigation: youTubeNavigations[0] },
          });
        }
      });
    };
    browser.runtime.onConnect.addListener(this.contentScriptPortListener);

    // Set up the active tab dwell time monitor
    openWpmPacketHandler.activeTabDwellTimeMonitor.run();

    // Add hooks to the navigation batch preprocessor
    openWpmPacketHandler.navigationBatchPreprocessor.processedNavigationBatchTrimmer = async (
      navigationBatch: TrimmedNavigationBatch,
    ): Promise<TrimmedNavigationBatch> => {
      // Keep track of aggregated statistics
      youTubeUsageStatisticsMonitor.seenNavigationBatch(navigationBatch);

      // trim away irrelevant parts of the batch (decreases memory usage)
      // TODO
      return reportSummarizer.trimNavigationBatch(navigationBatch);
    };

    // Start the navigation batch preprocessor
    await openWpmPacketHandler.navigationBatchPreprocessor.run();

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

    // Periodic submission of YouTube usage statistics
    // TODO
    // youTubeUsageStatisticsMonitor
  }

  async startOpenWPMInstrumentation(config) {
    this.openwpmCrawlId = config["crawl_id"];
    if (config["navigation_instrument"]) {
      await openWpmPacketHandler.logDebug("Navigation instrumentation enabled");
      this.navigationInstrument = new NavigationInstrument(
        openWpmPacketHandler,
      );
      this.navigationInstrument.run(config["crawl_id"]);
    }
    if (config["cookie_instrument"]) {
      await openWpmPacketHandler.logDebug("Cookie instrumentation enabled");
      this.cookieInstrument = new CookieInstrument(openWpmPacketHandler);
      this.cookieInstrument.run(config["crawl_id"]);
    }
    if (config["js_instrument"]) {
      await openWpmPacketHandler.logDebug("Javascript instrumentation enabled");
      this.jsInstrument = new JavascriptInstrument(openWpmPacketHandler);
      this.jsInstrument.run(config["crawl_id"]);
    }
    if (config["http_instrument"]) {
      await openWpmPacketHandler.logDebug("HTTP Instrumentation enabled");
      this.httpInstrument = new HttpInstrument(openWpmPacketHandler);
      this.httpInstrument.run(
        config["crawl_id"],
        config["save_content"],
        config["http_instrument_resource_types"],
        config["http_instrument_urls"],
      );
    }
  }

  pause() {
    openWpmPacketHandler.pause();
    if (openWpmPacketHandler.activeTabDwellTimeMonitor) {
      openWpmPacketHandler.activeTabDwellTimeMonitor.cleanup();
    }
    if (openWpmPacketHandler.navigationBatchPreprocessor) {
      openWpmPacketHandler.navigationBatchPreprocessor.cleanup();
    }
  }

  resume() {
    openWpmPacketHandler.resume();
    if (openWpmPacketHandler.activeTabDwellTimeMonitor) {
      openWpmPacketHandler.activeTabDwellTimeMonitor.run();
    }
    if (openWpmPacketHandler.navigationBatchPreprocessor) {
      openWpmPacketHandler.navigationBatchPreprocessor.run();
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
    if (openWpmPacketHandler.activeTabDwellTimeMonitor) {
      openWpmPacketHandler.activeTabDwellTimeMonitor.cleanup();
    }
    if (openWpmPacketHandler.navigationBatchPreprocessor) {
      await openWpmPacketHandler.navigationBatchPreprocessor.cleanup();
    }
  }
}

// make an instance of the ExtensionGlue class available to the extension background context
const extensionGlue = ((window as any).extensionGlue = new ExtensionGlue());

// make the openWpmPacketHandler singleton and triggerClientDownloadOfData available to
// the extension background context so that we as developers can collect fixture data
(window as any).openWpmPacketHandler = openWpmPacketHandler;
(window as any).triggerClientDownloadOfData = triggerClientDownloadOfData;

// init the extension glue on every extension load
async function onEveryExtensionLoad() {
  const consentGiven = (await getConsentStatus()) === "given";
  await extensionGlue.init();
  if (consentGiven) {
    await extensionGlue.start();
  } else {
    await extensionGlue.askForConsent();
  }
}
onEveryExtensionLoad().then();

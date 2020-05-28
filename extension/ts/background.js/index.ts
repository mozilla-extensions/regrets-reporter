/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(extensionGlue)" }]*/

import { Sentry } from "../shared-resources/Sentry";
import { browser } from "webextension-polyfill-ts";
import {
  CookieInstrument,
  JavascriptInstrument,
  HttpInstrument,
  NavigationInstrument,
  UiInstrument,
} from "@openwpm/webext-instrumentation";
import {
  RegretReport,
  RegretReportData,
  ReportSummarizer,
} from "./ReportSummarizer";
import { triggerClientDownloadOfData } from "./lib/triggerClientDownloadOfData";
import {
  NavigationBatch,
  TrimmedNavigationBatch,
} from "./NavigationBatchPreprocessor";
import { YouTubeUsageStatistics } from "./YouTubeUsageStatistics";
import { OpenWpmPacketHandler } from "./openWpmPacketHandler";
import { DataSharer } from "./DataSharer";
import { Store } from "./Store";
import { localStorageWrapper } from "./lib/localStorageWrapper";
import { getCurrentTab } from "./lib/getCurrentTab";
const openWpmPacketHandler = new OpenWpmPacketHandler();
const reportSummarizer = new ReportSummarizer();
const store = new Store(localStorageWrapper);
const youTubeUsageStatistics = new YouTubeUsageStatistics(
  store,
  reportSummarizer,
);
const dataSharer = new DataSharer(store);

class ExtensionGlue {
  private navigationInstrument: NavigationInstrument;
  private cookieInstrument: CookieInstrument;
  private jsInstrument: JavascriptInstrument;
  private httpInstrument: HttpInstrument;
  private uiInstrument: UiInstrument;
  private openwpmCrawlId: string;
  private contentScriptPortListener;
  private optionsUiPortListener;
  private reportRegretFormPortListener;

  constructor() {}

  async init() {
    // Set up a connection / listener for the get-started script to be able to query consent status
    let portFromContentScript;
    this.contentScriptPortListener = p => {
      if (p.name !== "port-from-get-started") {
        return;
      }
      // console.log("Connected to get-started script");
      portFromContentScript = p;
      portFromContentScript.onMessage.addListener(async function(m) {
        // console.log("Message from get-started script:", { m });
        if (m.requestConsentStatus) {
          portFromContentScript.postMessage({
            consentStatus: await store.getConsentStatus(),
            consentStatusTimestamp: await store.getConsentStatusTimestamp(),
          });
        }
        if (m.updatedConsentStatus) {
          const { userPartOfMarginalizedGroup } = m;
          await store.setConsentStatus(m.updatedConsentStatus);
          await store.setUserSuppliedDemographics({
            user_part_of_marginalized_group: userPartOfMarginalizedGroup,
          });
          const consentGiven = (await store.getConsentStatus()) === "given";
          if (consentGiven) {
            console.log("Enrolled. Starting study");
            await dataSharer.share({
              data_sharing_consent_update: {
                consent_status: await store.getConsentStatus(),
                consent_status_timestamp: await store.getConsentStatusTimestamp(),
              },
            });
            await extensionGlue.start();
          }
        }
      });
    };
    browser.runtime.onConnect.addListener(this.contentScriptPortListener);
    // Set up a connection / listener for the options-ui script to be able to query preferences
    let portFromOptionsUi;
    this.optionsUiPortListener = p => {
      if (p.name !== "port-from-options-ui") {
        return;
      }
      console.log("Connected to options-ui script");
      portFromOptionsUi = p;
      portFromOptionsUi.onMessage.addListener(async function(m) {
        console.log("Message from get-started script:", { m });
        if (m.requestExtensionPreferences) {
          portFromOptionsUi.postMessage({
            extensionPreferences: await store.getExtensionPreferences(),
          });
        }
        if (m.updatedExtensionPreferences) {
          await store.setExtensionPreferences(m.updatedExtensionPreferences);
          // TODO: React on changes to preferences here
          portFromOptionsUi.postMessage({
            extensionPreferences: await store.getExtensionPreferences(),
          });
        }
      });
    };
    browser.runtime.onConnect.addListener(this.optionsUiPortListener);
  }

  async askForConsent() {
    // Open consent form
    const consentFormUrl = browser.runtime.getURL(
      `get-started/get-started.html`,
    );
    await browser.tabs.create({ url: consentFormUrl });
  }

  async start() {
    // Only show report-regret page action on YouTube watch pages
    const showPageActionOnWatchPagesOnly = (tabId, changeInfo, tab) => {
      if (tab.url.match(/:\/\/[^\/]*\.?youtube.com\/watch/)) {
        browser.pageAction.show(tab.id);
      } else {
        browser.pageAction.hide(tab.id);
      }
    };
    browser.tabs.onUpdated.addListener(showPageActionOnWatchPagesOnly);

    // Make the page action show on watch pages also in case extension is loaded/reloaded while on one
    const currentTab = await getCurrentTab();
    if (currentTab) {
      showPageActionOnWatchPagesOnly(currentTab.id, null, currentTab);
    }

    // Restore persisted youTubeUsageStatistics
    await youTubeUsageStatistics.hydrate();

    // Set up a connection / listener for content scripts to be able to query collected web traffic data
    let portFromReportRegretForm;
    this.reportRegretFormPortListener = p => {
      if (p.name !== "port-from-report-regret-form") {
        return;
      }
      portFromReportRegretForm = p;
      portFromReportRegretForm.onMessage.addListener(async function(m: {
        regretReport?: RegretReport;
        requestRegretReportData?: {
          windowId: number;
          tabId: number;
          skipWindowAndTabIdFilter?: boolean;
        };
      }) {
        console.log("Message from report-regret-form script:", { m });
        if (m.regretReport) {
          const { regretReport } = m;
          // Share the reported regret
          dataSharer.share({ regret_report: regretReport });
          console.log("Reported regret shared");
        }
        // The report form has triggered a report-related data collection
        if (m.requestRegretReportData) {
          try {
            const {
              windowId,
              tabId,
              skipWindowAndTabIdFilter,
            } = m.requestRegretReportData;
            await openWpmPacketHandler.navigationBatchPreprocessor.processQueue();
            const youTubeNavigations = await reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
              openWpmPacketHandler.navigationBatchPreprocessor
                .navigationBatchesByNavigationUuid,
            );
            const youTubeNavigationSpecificRegretReportData = await reportSummarizer.youTubeNavigationSpecificRegretReportDataFromYouTubeNavigations(
              youTubeNavigations,
              windowId,
              tabId,
              skipWindowAndTabIdFilter,
            );
            const youtube_usage_statistics_update = await youTubeUsageStatistics.summarizeUpdate();
            const regretReportData: RegretReportData = {
              ...youTubeNavigationSpecificRegretReportData,
              youtube_usage_statistics_update,
            };
            portFromReportRegretForm.postMessage({
              regretReportData,
            });
          } catch (error) {
            console.error(
              "Error encountered during regret report data processing",
              error,
            );
            portFromReportRegretForm.postMessage({
              errorMessage: error.message,
            });
          }
        }
      });
    };
    browser.runtime.onConnect.addListener(this.reportRegretFormPortListener);

    // Add hooks to the navigation batch preprocessor
    openWpmPacketHandler.navigationBatchPreprocessor.processedNavigationBatchTrimmer = async (
      navigationBatch: NavigationBatch,
    ): Promise<TrimmedNavigationBatch> => {
      try {
        // Keep track of aggregated statistics
        await youTubeUsageStatistics.seenNavigationBatch(navigationBatch);
      } catch (error) {
        console.error(
          "Error encountered during youTubeUsageStatistics.seenNavigationBatch",
          error,
        );
      }

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
      http_instrument_urls: "*://*.youtube.com/*|*://*.youtu.be/*",
      ui_instrument: true,
      ui_instrument_modules: "clicks,state",
      crawl_id: 0,
    };
    await this.startOpenWPMInstrumentation(openwpmConfig);

    // Periodic submission of YouTube usage statistics
    await youTubeUsageStatistics.run(dataSharer);
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
      await openWpmPacketHandler.logDebug("HTTP instrumentation enabled");
      this.httpInstrument = new HttpInstrument(openWpmPacketHandler);
      this.httpInstrument.run(
        config["crawl_id"],
        config["save_content"],
        config["http_instrument_resource_types"],
        config["http_instrument_urls"],
      );
    }
    if (config["ui_instrument"]) {
      await openWpmPacketHandler.logDebug("UI instrumentation enabled");
      this.uiInstrument = new UiInstrument(openWpmPacketHandler);
      this.uiInstrument.run(config["crawl_id"]);
      const registerContentScriptOptions = {
        matches: ["*://*.youtube.com/*"],
        allFrames: false,
        matchAboutBlank: false,
      };
      await this.uiInstrument.registerContentScript(
        config["testing"],
        config["ui_instrument_modules"],
        registerContentScriptOptions,
      );
    }
  }

  pause() {
    openWpmPacketHandler.pause();
    if (openWpmPacketHandler.navigationBatchPreprocessor) {
      openWpmPacketHandler.navigationBatchPreprocessor.cleanup();
    }
  }

  resume() {
    openWpmPacketHandler.resume();
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
    if (this.optionsUiPortListener) {
      browser.runtime.onMessage.removeListener(this.optionsUiPortListener);
    }
    if (this.reportRegretFormPortListener) {
      browser.runtime.onMessage.removeListener(
        this.reportRegretFormPortListener,
      );
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
    if (this.uiInstrument) {
      await this.uiInstrument.cleanup();
    }
    if (openWpmPacketHandler.navigationBatchPreprocessor) {
      await openWpmPacketHandler.navigationBatchPreprocessor.cleanup();
    }
    if (openWpmPacketHandler.navigationBatchPreprocessor) {
      await youTubeUsageStatistics.cleanup();
    }
  }
}

// make an instance of the ExtensionGlue class available to the extension background context
const extensionGlue = ((window as any).extensionGlue = new ExtensionGlue());

// make the openWpmPacketHandler singleton and triggerClientDownloadOfData available to
// the extension background context so that we as developers can collect fixture data
(window as any).openWpmPacketHandler = openWpmPacketHandler;
(window as any).reportSummarizer = reportSummarizer;
(window as any).triggerClientDownloadOfData = triggerClientDownloadOfData;
(window as any).exportSharedData = async () => {
  const sharedData = await dataSharer.export();
  return triggerClientDownloadOfData(
    sharedData,
    `youTubeRegretsReporter-sharedData-userUuid=${await store.extensionInstallationUuid()}.json`,
  );
};

// init the extension glue on every extension load
async function onEveryExtensionLoad() {
  const consentGiven = (await store.getConsentStatus()) === "given";
  await extensionGlue.init();
  if (consentGiven) {
    await extensionGlue.start();
  } else {
    await extensionGlue.askForConsent();
  }
}
onEveryExtensionLoad().then();

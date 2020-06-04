/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "(extensionGlue)" }]*/

import {
  captureExceptionWithExtras,
  initErrorReportingInBackgroundScript,
} from "../shared-resources/ErrorReporting";
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

/**
 * Ties together overall execution logic and allows content scripts
 * to access persistent storage via cross-process messaging
 */
class ExtensionGlue {
  private navigationInstrument: NavigationInstrument;
  private cookieInstrument: CookieInstrument;
  private jsInstrument: JavascriptInstrument;
  private httpInstrument: HttpInstrument;
  private uiInstrument: UiInstrument;
  private openwpmCrawlId: string;
  private getStartedPortListener;
  private extensionPreferencesPortListener;
  private reportRegretFormPortListener;

  constructor() {}

  async init() {
    // Enable error reporting if not opted out
    this.extensionPreferencesPortListener = initErrorReportingInBackgroundScript(
      store,
      [
        "port-from-report-regret-form:index",
        "port-from-options-ui:index",
        "port-from-options-ui:form",
        "port-from-get-started:index",
        "port-from-ui-instrument-content-script:index",
      ],
    );
  }

  async openGetStarted() {
    const consentFormUrl = browser.runtime.getURL(
      `get-started/get-started.html`,
    );
    await browser.tabs.create({ url: consentFormUrl });
  }

  async start() {
    // Only show report-regret page action on YouTube watch pages
    const showPageActionOnWatchPagesOnly = (tabId, changeInfo, tab) => {
      function onExecuted(result) {
        const url = result ? result[0] : false;
        if (url && url.match(/:\/\/[^\/]*\.?youtube.com\/watch/)) {
          browser.pageAction.show(tab.id);
        } else {
          browser.pageAction.hide(tab.id);
        }
      }
      function onError(_error) {
        browser.pageAction.hide(tab.id);
      }
      const executing = browser.tabs.executeScript({
        code: "location.href",
      });
      executing.then(onExecuted, onError);
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
            captureExceptionWithExtras(error, {
              msg: "Error encountered during regret report data processing",
            });
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
        captureExceptionWithExtras(error, {
          msg:
            "Error encountered during youTubeUsageStatistics.seenNavigationBatch",
        });
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
      ui_instrument_clicks: true,
      ui_instrument_state: true,
      ui_instrument_state_interval_ms: "1000",
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
        {
          testing: config["testing"],
          clicks: config["ui_instrument_clicks"],
          state: config["ui_instrument_state"],
          state_interval_ms: config["ui_instrument_state_interval_ms"],
        },
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
    if (this.getStartedPortListener) {
      browser.runtime.onMessage.removeListener(this.getStartedPortListener);
    }
    if (this.extensionPreferencesPortListener) {
      browser.runtime.onMessage.removeListener(
        this.extensionPreferencesPortListener,
      );
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
  await extensionGlue.init();
  const { hasOpenedGetStarted } = await browser.storage.local.get(
    "hasOpenedGetStarted",
  );
  if (!hasOpenedGetStarted) {
    await extensionGlue.openGetStarted();
    await browser.storage.local.set({ hasOpenedGetStarted: true });
  }
  await extensionGlue.start();
}
onEveryExtensionLoad().then();

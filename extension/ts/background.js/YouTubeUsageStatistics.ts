import { NavigationBatch } from "./NavigationBatchPreprocessor";
import { parseIsoDateTimeString } from "./lib/dateUtils";
import { format } from "date-fns";
import { DataSharer } from "./DataSharer";
import { browser, Tabs } from "webextension-polyfill-ts";
import { Store } from "./Store";
import { classifyYouTubeNavigationUrlType } from "./lib/youTubeNavigationUrlType";
import { ReportSummarizer, YouTubeNavigation } from "./ReportSummarizer";
import { ActiveTabDwellTimeMonitor } from "./ActiveTabDwellTimeMonitor";
import Tab = Tabs.Tab;

export interface YouTubeUsageStatisticsUpdate {
  amount_of_days_of_at_least_one_youtube_visit: number;
  amount_of_youtube_watch_pages_loaded: number;
  amount_of_time_with_an_active_youtube_tab: number;
  /*
  amount_of_youtube_videos_played_on_youtube_watch_pages: number;
  amount_of_youtube_video_play_time_in_seconds: number;
  */
}

interface YouTubeUsageStatisticsRegistry {
  dates_with_at_least_one_youtube_visit: string[];
  amount_of_youtube_watch_pages_loaded_by_date: {
    [date: string]: number;
  };
  amount_of_time_with_an_active_youtube_tab_by_date: { [date: string]: number };
  /*
  amount_of_youtube_videos_played_on_youtube_watch_pages_by_date: {
    [date: string]: number;
  };
  amount_of_youtube_video_play_time_in_seconds_by_date: {
    [date: string]: number;
  };
  */
}

export class YouTubeUsageStatistics implements YouTubeUsageStatisticsRegistry {
  public store: Store;
  public reportSummarizer: ReportSummarizer;
  public activeTabDwellTimeMonitor: ActiveTabDwellTimeMonitor;
  public amount_of_youtube_watch_pages_loaded_by_date;
  public amount_of_time_with_an_active_youtube_tab_by_date;
  /*
  public amount_of_youtube_video_play_time_in_seconds_by_date;
  public amount_of_youtube_videos_played_on_youtube_watch_pages_by_date;
  */
  public dates_with_at_least_one_youtube_visit;

  constructor(
    store: Store,
    reportSummarizer: ReportSummarizer,
    activeTabDwellTimeMonitor: ActiveTabDwellTimeMonitor,
  ) {
    this.store = store;
    this.reportSummarizer = reportSummarizer;
    this.activeTabDwellTimeMonitor = activeTabDwellTimeMonitor;
    const originalDwellTimeHook = activeTabDwellTimeMonitor.tabActiveDwellTimeIncrement.bind(
      activeTabDwellTimeMonitor,
    );
    activeTabDwellTimeMonitor.tabActiveDwellTimeIncrement = (
      tab: Tab,
      intervalMs: number,
    ) => {
      this.seenTabActiveDwellTimeIncrement(tab, intervalMs);
      originalDwellTimeHook(tab, intervalMs);
    };
  }

  seenTabActiveDwellTimeIncrement = (tab: Tab, intervalMs: number) => {
    if (!this.hydrated) {
      throw new Error("Instance not hydrated");
    }
    const tabUrlType = classifyYouTubeNavigationUrlType(tab.url);
    if (tabUrlType === "watch_page") {
      const dateTime = Date.now();
      const dateYmd = format(dateTime, "yyyy-MM-dd");
      if (
        typeof this.amount_of_time_with_an_active_youtube_tab_by_date[
          dateYmd
        ] === "undefined"
      ) {
        this.amount_of_time_with_an_active_youtube_tab_by_date[dateYmd] = 0;
      }
      this.amount_of_time_with_an_active_youtube_tab_by_date[dateYmd] =
        this.amount_of_time_with_an_active_youtube_tab_by_date[dateYmd] +
        intervalMs;
    }
  };

  seenNavigationBatch = async (
    navigationBatch: NavigationBatch,
  ): Promise<void> => {
    if (!this.hydrated) {
      throw new Error("Instance not hydrated");
    }
    const navigationBatchByUuid = {};
    navigationBatchByUuid[
      navigationBatch.navigationEnvelope.navigation.uuid
    ] = navigationBatch;
    const youTubeNavigations = await this.reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      navigationBatchByUuid,
    );
    youTubeNavigations.map(this.seenYouTubeNavigation);
  };

  seenYouTubeNavigation = async (
    youTubeNavigation: YouTubeNavigation,
  ): Promise<void> => {
    if (!this.hydrated) {
      throw new Error("Instance not hydrated");
    }
    const dateTime = parseIsoDateTimeString(youTubeNavigation.time_stamp);
    const dateYmd = format(dateTime, "yyyy-MM-dd");
    if (!this.dates_with_at_least_one_youtube_visit.includes(dateYmd)) {
      this.dates_with_at_least_one_youtube_visit.push(dateYmd);
    }
    if (
      classifyYouTubeNavigationUrlType(youTubeNavigation.url) === "watch_page"
    ) {
      if (
        typeof this.amount_of_youtube_watch_pages_loaded_by_date[dateYmd] ===
        "undefined"
      ) {
        this.amount_of_youtube_watch_pages_loaded_by_date[dateYmd] = 0;
      }
      this.amount_of_youtube_watch_pages_loaded_by_date[dateYmd]++;
    }
  };

  summarizeUpdate = async (): Promise<YouTubeUsageStatisticsUpdate> => {
    if (!this.hydrated) {
      throw new Error("Instance not hydrated");
    }
    const {
      dates_with_at_least_one_youtube_visit,
      amount_of_youtube_watch_pages_loaded_by_date,
      amount_of_time_with_an_active_youtube_tab_by_date,
    } = this;
    let amount_of_youtube_watch_pages_loaded = 0;
    if (amount_of_youtube_watch_pages_loaded_by_date) {
      const dateYmds = Object.keys(
        amount_of_youtube_watch_pages_loaded_by_date,
      );
      // console.log({ dateYmds, amount_of_youtube_watch_pages_loaded_by_date });
      amount_of_youtube_watch_pages_loaded = dateYmds
        .map(date => amount_of_youtube_watch_pages_loaded_by_date[date])
        .reduce((a, b) => a + b, 0);
    }
    let amount_of_time_with_an_active_youtube_tab = 0;
    if (amount_of_time_with_an_active_youtube_tab_by_date) {
      const dateYmds = Object.keys(
        amount_of_time_with_an_active_youtube_tab_by_date,
      );
      // console.log({ dateYmds, amount_of_time_with_an_active_youtube_tab_by_date });
      amount_of_time_with_an_active_youtube_tab = dateYmds
        .map(date => amount_of_time_with_an_active_youtube_tab_by_date[date])
        .reduce((a, b) => a + b, 0);
    }
    return {
      amount_of_days_of_at_least_one_youtube_visit: dates_with_at_least_one_youtube_visit
        ? dates_with_at_least_one_youtube_visit.length
        : 0,
      amount_of_youtube_watch_pages_loaded,
      amount_of_time_with_an_active_youtube_tab,
      /*
      amount_of_youtube_videos_played_on_youtube_watch_pages: -1,
      amount_of_youtube_video_play_time_in_seconds: -1,
       */
    };
  };

  private hydrated = false;

  hydrate = async () => {
    const {
      dates_with_at_least_one_youtube_visit,
      amount_of_youtube_watch_pages_loaded_by_date,
      amount_of_time_with_an_active_youtube_tab_by_date,
    } = await this.store.get([
      "dates_with_at_least_one_youtube_visit",
      "amount_of_youtube_watch_pages_loaded_by_date",
      "amount_of_time_with_an_active_youtube_tab_by_date",
    ]);
    this.dates_with_at_least_one_youtube_visit =
      dates_with_at_least_one_youtube_visit || [];
    this.amount_of_youtube_watch_pages_loaded_by_date =
      amount_of_youtube_watch_pages_loaded_by_date || {};
    this.amount_of_time_with_an_active_youtube_tab_by_date =
      amount_of_time_with_an_active_youtube_tab_by_date || {};
    this.hydrated = true;
  };

  persist = async () => {
    // Protection from accidentally emptying persisted data
    if (!this.hydrated) {
      throw new Error("Instance not hydrated");
    }
    await this.store.set({
      dates_with_at_least_one_youtube_visit: this
        .dates_with_at_least_one_youtube_visit,
      amount_of_youtube_watch_pages_loaded_by_date: this
        .amount_of_youtube_watch_pages_loaded_by_date,
      amount_of_time_with_an_active_youtube_tab_by_date: this
        .amount_of_time_with_an_active_youtube_tab_by_date,
    });
  };

  private shareDataAlarmName: string;
  private persistDataAlarmName: string;

  public async run(dataSharer: DataSharer) {
    await this.persistDataPeriodically();
    await this.shareDataPeriodically(dataSharer);
  }

  public async persistDataPeriodically() {
    this.persistDataAlarmName = `${browser.runtime.id}:youTubeUsageStatisticsPersistDataAlarm`;
    const alarmListener = async _alarm => {
      if (_alarm.name !== this.persistDataAlarmName) {
        return false;
      }
      await this.persist();
    };
    browser.alarms.onAlarm.addListener(alarmListener);
    browser.alarms.create(this.persistDataAlarmName, {
      periodInMinutes: 5, // every 5 minutes
    });
    // Persist the current data immediately
    await this.persist();
  }

  public async shareDataPeriodically(dataSharer: DataSharer) {
    this.shareDataAlarmName = `${browser.runtime.id}:youTubeUsageStatisticsShareDataAlarm`;
    const summarizeAndShareStatistics = async () => {
      console.info(`Summarizing and sharing youtube_usage_statistics_update`);
      const youTubeUsageStatisticsUpdate = await this.summarizeUpdate();
      await dataSharer.share({
        youtube_usage_statistics_update: youTubeUsageStatisticsUpdate,
      });
    };
    const alarmListener = async _alarm => {
      if (_alarm.name !== this.shareDataAlarmName) {
        return false;
      }
      await summarizeAndShareStatistics();
    };
    browser.alarms.onAlarm.addListener(alarmListener);
    browser.alarms.create(this.shareDataAlarmName, {
      periodInMinutes: 24 * 60, // every 24 hours
    });
    // Execute the first summary immediately
    await summarizeAndShareStatistics();
  }

  public async cleanup() {
    if (this.shareDataAlarmName) {
      await browser.alarms.clear(this.shareDataAlarmName);
    }
    if (this.persistDataAlarmName) {
      await browser.alarms.clear(this.persistDataAlarmName);
    }
  }
}

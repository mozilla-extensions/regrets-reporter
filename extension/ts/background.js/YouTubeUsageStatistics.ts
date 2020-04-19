import { NavigationBatch } from "./NavigationBatchPreprocessor";
import { parseIsoDateTimeString } from "./lib/dateUtils";
import { format } from "date-fns";
import { DataSharer } from "./DataSharer";
import { browser } from "webextension-polyfill-ts";
import { Store } from "./Store";
import { classifyYouTubeNavigationUrlType } from "./lib/youTubeNavigationUrlType";
import { ReportSummarizer, YouTubeNavigation } from "./ReportSummarizer";

export interface YouTubeUsageStatisticsUpdate {
  amount_of_days_of_at_least_one_youtube_visit: number;
  amount_of_youtube_watch_pages_loaded: number;
  /*
  amount_of_youtube_videos_played_on_youtube_watch_pages: number;
  amount_of_time_with_an_active_youtube_tab: number;
  amount_of_youtube_video_play_time_in_seconds: number;
  */
}

interface YouTubeUsageStatisticsRegistry {
  dates_with_at_least_one_youtube_visit: string[];
  amount_of_youtube_watch_pages_loaded_by_date: {
    [date: string]: number;
  };
  /*
  amount_of_youtube_videos_played_on_youtube_watch_pages_by_date: {
    [date: string]: number;
  };
  amount_of_time_with_an_active_youtube_tab_by_date: { [date: string]: number };
  amount_of_youtube_video_play_time_in_seconds_by_date: {
    [date: string]: number;
  };
  */
}

export class YouTubeUsageStatistics implements YouTubeUsageStatisticsRegistry {
  public store: Store;
  public reportSummarizer: ReportSummarizer;
  public amount_of_youtube_watch_pages_loaded_by_date = {};
  /*
  public amount_of_time_with_an_active_youtube_tab_by_date = {};
  public amount_of_youtube_video_play_time_in_seconds_by_date = {};
  public amount_of_youtube_videos_played_on_youtube_watch_pages_by_date = {};
  */
  public dates_with_at_least_one_youtube_visit = [];

  constructor(store, reportSummarizer) {
    this.store = store;
    this.reportSummarizer = reportSummarizer;
  }

  seenNavigationBatch = async (
    navigationBatch: NavigationBatch,
  ): Promise<void> => {
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
    await this.store.set({
      dates_with_at_least_one_youtube_visit: this
        .dates_with_at_least_one_youtube_visit,
      amount_of_youtube_watch_pages_loaded_by_date: this
        .amount_of_youtube_watch_pages_loaded_by_date,
    });
  };

  summarizeUpdate = async (): Promise<YouTubeUsageStatisticsUpdate> => {
    const {
      dates_with_at_least_one_youtube_visit,
      amount_of_youtube_watch_pages_loaded_by_date,
    } = await this.store.get([
      "dates_with_at_least_one_youtube_visit",
      "amount_of_youtube_watch_pages_loaded_by_date",
    ]);
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
    return {
      amount_of_days_of_at_least_one_youtube_visit: dates_with_at_least_one_youtube_visit
        ? dates_with_at_least_one_youtube_visit.length
        : 0,
      amount_of_youtube_watch_pages_loaded,
      /*
      amount_of_youtube_videos_played_on_youtube_watch_pages: -1,
      amount_of_time_with_an_active_youtube_tab: -1,
      amount_of_youtube_video_play_time_in_seconds: -1,
       */
    };
  };

  private alarmName: string;

  public async run(dataSharer: DataSharer) {
    this.alarmName = `${browser.runtime.id}:youTubeUsageStatisticsAlarm`;
    const summarizeAndShareStatistics = async () => {
      console.info(`Summarizing and sharing youtube_usage_statistics_update`);
      const youTubeUsageStatisticsUpdate = await this.summarizeUpdate();
      await dataSharer.share({
        youtube_usage_statistics_update: youTubeUsageStatisticsUpdate,
      });
    };
    const alarmListener = async _alarm => {
      if (_alarm.name !== this.alarmName) {
        return false;
      }
      await summarizeAndShareStatistics();
    };
    browser.alarms.onAlarm.addListener(alarmListener);
    browser.alarms.create(this.alarmName, {
      periodInMinutes: 24 * 60, // every 24 hours
    });
    // Execute the first summary immediately
    await summarizeAndShareStatistics();
  }

  public async cleanup() {
    if (this.alarmName) {
      await browser.alarms.clear(this.alarmName);
    }
  }
}

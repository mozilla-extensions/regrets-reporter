import { NavigationBatch } from "./NavigationBatchPreprocessor";
import { parseIsoDateTimeString } from "./lib/dateUtils";
import { format } from "date-fns";
import { DataSharer } from "./DataSharer";

export interface YouTubeUsageStatisticsUpdate {
  amount_of_days_of_at_least_one_youtube_visit: number;
  /*
  amount_of_youtube_youtube_watch_pages_loaded: number;
  amount_of_youtube_videos_played_on_youtube_watch_pages: number;
  amount_of_time_with_an_active_youtube_tab: number;
  amount_of_youtube_video_play_time_in_seconds: number;
  */
}

interface YouTubeUsageStatisticsRegistry {
  dates_with_at_least_one_youtube_visit: string[];
  /*
  amount_of_youtube_youtube_watch_pages_loaded_by_date: {
    [date: string]: number;
  };
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
  /*
  public amount_of_time_with_an_active_youtube_tab_by_date = {};
  public amount_of_youtube_video_play_time_in_seconds_by_date = {};
  public amount_of_youtube_videos_played_on_youtube_watch_pages_by_date = {};
  public amount_of_youtube_youtube_watch_pages_loaded_by_date = {};
  */
  public dates_with_at_least_one_youtube_visit = [];

  seenNavigationBatch = (navigationBatch: NavigationBatch): void => {
    // console.log("seen TODO statistics", { navigationBatch });
    const dateTime = parseIsoDateTimeString(
      navigationBatch.navigationEnvelope.navigation.committed_time_stamp,
    );
    const dateYmd = format(dateTime, "Y-m-d");
    if (!this.dates_with_at_least_one_youtube_visit.includes(dateYmd)) {
      this.dates_with_at_least_one_youtube_visit.push(dateYmd);
    }
    // TODO persist
  };

  summarizeUpdate = (): YouTubeUsageStatisticsUpdate => {
    return {
      amount_of_days_of_at_least_one_youtube_visit: this
        .dates_with_at_least_one_youtube_visit.length,
      /*
      amount_of_youtube_youtube_watch_pages_loaded: -1,
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
      console.info(`Summarizing and sharing youTubeUsageStatisticsUpdate`);
      const youTubeUsageStatisticsUpdate = this.summarizeUpdate();
      await dataSharer.share({ youTubeUsageStatisticsUpdate });
    };
    const alarmListener = async _alarm => {
      summarizeAndShareStatistics();
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

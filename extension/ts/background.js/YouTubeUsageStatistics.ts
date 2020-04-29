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
  amount_of_days_with_at_least_one_youtube_visit: number;
  amount_of_time_with_an_active_youtube_tab: number;
  amount_of_youtube_watch_pages_loaded_by_category: {
    in_total: number;
    via_search_results: number;
    via_non_search_algorithmic_recommendations_content: number;
    via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: number;
  };
  amount_of_days_with_at_least_one_youtube_watch_page_load_by_category: {
    in_total: number;
    via_search_results: number;
    via_non_search_algorithmic_recommendations_content: number;
    via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: number;
  };
}
interface AmountByDate {
  [date: string]: number;
}

interface DatesByCategory {
  in_total: string[];
  via_search_results: string[];
  via_non_search_algorithmic_recommendations_content: string[];
  via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: string[];
}

interface AmountsByCategoryAndDate {
  in_total: AmountByDate;
  via_search_results: AmountByDate;
  via_non_search_algorithmic_recommendations_content: AmountByDate;
  via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: AmountByDate;
}

interface YouTubeUsageStatisticsRegistry {
  dates_with_at_least_one_youtube_visit: string[];
  amount_of_time_with_an_active_youtube_tab_by_date: AmountByDate;
  amount_of_youtube_watch_pages_loaded_by_category_and_date: AmountsByCategoryAndDate;
  dates_with_at_least_one_youtube_watch_page_load_by_category: DatesByCategory;
}

const emptyAmountsByCategoryAndDates = () => ({
  in_total: {},
  via_search_results: {},
  via_non_search_algorithmic_recommendations_content: {},
  via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: {},
});
const emptyDatesByCategory = () => ({
  in_total: [],
  via_search_results: [],
  via_non_search_algorithmic_recommendations_content: [],
  via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: [],
});
const emptyAmountsByCategory = () => ({
  in_total: 0,
  via_search_results: 0,
  via_non_search_algorithmic_recommendations_content: 0,
  via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
});

export class YouTubeUsageStatistics implements YouTubeUsageStatisticsRegistry {
  public store: Store;
  public reportSummarizer: ReportSummarizer;
  public activeTabDwellTimeMonitor: ActiveTabDwellTimeMonitor;
  public dates_with_at_least_one_youtube_visit;
  public amount_of_time_with_an_active_youtube_tab_by_date;
  public amount_of_youtube_watch_pages_loaded_by_category_and_date;
  public dates_with_at_least_one_youtube_watch_page_load_by_category;
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

  incrementDateAmount(amountsByDate, dateYmd: string, increment: number = 1) {
    if (typeof amountsByDate[dateYmd] === "undefined") {
      amountsByDate[dateYmd] = 0;
    }
    amountsByDate[dateYmd] = amountsByDate[dateYmd] + increment;
  }

  seenTabActiveDwellTimeIncrement = (tab: Tab, intervalMs: number) => {
    if (!this.hydrated) {
      throw new Error("Instance not hydrated");
    }
    const tabUrlType = classifyYouTubeNavigationUrlType(tab.url);
    if (tabUrlType === "watch_page") {
      const dateTime = Date.now();
      const dateYmd = format(dateTime, "yyyy-MM-dd");
      this.incrementDateAmount(
        this.amount_of_time_with_an_active_youtube_tab_by_date,
        dateYmd,
        intervalMs,
      );
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
        !this.dates_with_at_least_one_youtube_watch_page_load_by_category.in_total.includes(
          dateYmd,
        )
      ) {
        this.dates_with_at_least_one_youtube_watch_page_load_by_category.in_total.push(
          dateYmd,
        );
      }
      this.incrementDateAmount(
        this.amount_of_youtube_watch_pages_loaded_by_category_and_date.in_total,
        dateYmd,
      );
      if (
        this.reportSummarizer.viaSearchResultsFromYouTubeNavigation(
          youTubeNavigation,
        )
      ) {
        if (
          !this.dates_with_at_least_one_youtube_watch_page_load_by_category.via_search_results.includes(
            dateYmd,
          )
        ) {
          this.dates_with_at_least_one_youtube_watch_page_load_by_category.via_search_results.push(
            dateYmd,
          );
        }
        this.incrementDateAmount(
          this.amount_of_youtube_watch_pages_loaded_by_category_and_date
            .via_search_results,
          dateYmd,
        );
      }
      if (
        this.reportSummarizer.viaNonSearchAlgorithmicRecommendationsContentFromYouTubeNavigation(
          youTubeNavigation,
        )
      ) {
        if (
          !this.dates_with_at_least_one_youtube_watch_page_load_by_category.via_non_search_algorithmic_recommendations_content.includes(
            dateYmd,
          )
        ) {
          this.dates_with_at_least_one_youtube_watch_page_load_by_category.via_non_search_algorithmic_recommendations_content.push(
            dateYmd,
          );
        }
        this.incrementDateAmount(
          this.amount_of_youtube_watch_pages_loaded_by_category_and_date
            .via_non_search_algorithmic_recommendations_content,
          dateYmd,
        );
      }
      if (
        this.reportSummarizer.viaRecommendationsWithAnExplicitQueryOrConstraintToOptimizeForFromYouTubeNavigation(
          youTubeNavigation,
        )
      ) {
        if (
          !this.dates_with_at_least_one_youtube_watch_page_load_by_category.via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for.includes(
            dateYmd,
          )
        ) {
          this.dates_with_at_least_one_youtube_watch_page_load_by_category.via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for.push(
            dateYmd,
          );
        }
        this.incrementDateAmount(
          this.amount_of_youtube_watch_pages_loaded_by_category_and_date
            .via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for,
          dateYmd,
        );
      }
    }
  };

  summarizeUpdate = async (): Promise<YouTubeUsageStatisticsUpdate> => {
    if (!this.hydrated) {
      throw new Error("Instance not hydrated");
    }
    const reduceAmountsByDateToAmount = amountsByDateToAmount => {
      const dateYmds = Object.keys(amountsByDateToAmount);
      return dateYmds
        .map(date => amountsByDateToAmount[date])
        .reduce((a, b) => a + b, 0);
    };
    const {
      dates_with_at_least_one_youtube_visit,
      amount_of_youtube_watch_pages_loaded_by_category_and_date,
      amount_of_time_with_an_active_youtube_tab_by_date,
      dates_with_at_least_one_youtube_watch_page_load_by_category,
    } = this;
    const amount_of_days_with_at_least_one_youtube_visit = dates_with_at_least_one_youtube_visit
      ? dates_with_at_least_one_youtube_visit.length
      : 0;
    let amount_of_time_with_an_active_youtube_tab = 0;
    if (amount_of_time_with_an_active_youtube_tab_by_date) {
      amount_of_time_with_an_active_youtube_tab = reduceAmountsByDateToAmount(
        amount_of_time_with_an_active_youtube_tab_by_date,
      );
    }
    let amount_of_youtube_watch_pages_loaded_by_category = emptyAmountsByCategory();
    if (amount_of_youtube_watch_pages_loaded_by_category_and_date) {
      amount_of_youtube_watch_pages_loaded_by_category = {
        in_total: reduceAmountsByDateToAmount(
          amount_of_youtube_watch_pages_loaded_by_category_and_date.in_total,
        ),
        via_search_results: reduceAmountsByDateToAmount(
          amount_of_youtube_watch_pages_loaded_by_category_and_date.via_search_results,
        ),
        via_non_search_algorithmic_recommendations_content: reduceAmountsByDateToAmount(
          amount_of_youtube_watch_pages_loaded_by_category_and_date.via_non_search_algorithmic_recommendations_content,
        ),
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: reduceAmountsByDateToAmount(
          amount_of_youtube_watch_pages_loaded_by_category_and_date.via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for,
        ),
      };
    }
    let amount_of_days_with_at_least_one_youtube_watch_page_load_by_category = emptyAmountsByCategory();
    if (dates_with_at_least_one_youtube_watch_page_load_by_category) {
      amount_of_days_with_at_least_one_youtube_watch_page_load_by_category = {
        in_total: dates_with_at_least_one_youtube_watch_page_load_by_category.in_total
          ? dates_with_at_least_one_youtube_watch_page_load_by_category.in_total
              .length
          : 0,
        via_search_results: dates_with_at_least_one_youtube_watch_page_load_by_category.via_search_results
          ? dates_with_at_least_one_youtube_watch_page_load_by_category
              .via_search_results.length
          : 0,
        via_non_search_algorithmic_recommendations_content: dates_with_at_least_one_youtube_watch_page_load_by_category.via_non_search_algorithmic_recommendations_content
          ? dates_with_at_least_one_youtube_watch_page_load_by_category
              .via_non_search_algorithmic_recommendations_content.length
          : 0,
        via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: dates_with_at_least_one_youtube_watch_page_load_by_category.via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for
          ? dates_with_at_least_one_youtube_watch_page_load_by_category
              .via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for
              .length
          : 0,
      };
    }
    return {
      amount_of_days_with_at_least_one_youtube_visit,
      amount_of_time_with_an_active_youtube_tab,
      amount_of_youtube_watch_pages_loaded_by_category,
      amount_of_days_with_at_least_one_youtube_watch_page_load_by_category,
    };
  };

  private hydrated = false;

  hydrate = async () => {
    const {
      dates_with_at_least_one_youtube_visit,
      amount_of_youtube_watch_pages_loaded_by_category_and_date,
      amount_of_time_with_an_active_youtube_tab_by_date,
      dates_with_at_least_one_youtube_watch_page_load_by_category,
    } = await this.store.get([
      "dates_with_at_least_one_youtube_visit",
      "amount_of_youtube_watch_pages_loaded_by_category_and_date",
      "amount_of_time_with_an_active_youtube_tab_by_date",
      "dates_with_at_least_one_youtube_watch_page_load_by_category",
    ]);
    this.dates_with_at_least_one_youtube_visit =
      dates_with_at_least_one_youtube_visit || [];
    this.amount_of_youtube_watch_pages_loaded_by_category_and_date =
      amount_of_youtube_watch_pages_loaded_by_category_and_date ||
      emptyAmountsByCategoryAndDates();
    this.amount_of_time_with_an_active_youtube_tab_by_date =
      amount_of_time_with_an_active_youtube_tab_by_date || {};
    this.dates_with_at_least_one_youtube_watch_page_load_by_category =
      dates_with_at_least_one_youtube_watch_page_load_by_category ||
      emptyDatesByCategory();
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
      amount_of_time_with_an_active_youtube_tab_by_date: this
        .amount_of_time_with_an_active_youtube_tab_by_date,
      amount_of_youtube_watch_pages_loaded_by_category_and_date: this
        .amount_of_youtube_watch_pages_loaded_by_category_and_date,
      dates_with_at_least_one_youtube_watch_page_load_by_category: this
        .dates_with_at_least_one_youtube_watch_page_load_by_category,
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

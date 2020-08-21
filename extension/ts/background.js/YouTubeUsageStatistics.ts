import { NavigationBatch } from "./NavigationBatchPreprocessor";
import { parseIsoDateTimeString } from "./lib/dateUtils";
import { format } from "date-fns";
import { DataSharer } from "./DataSharer";
import { browser } from "webextension-polyfill-ts";
import { Store } from "./Store";
import { classifyYouTubeNavigationUrlType } from "./lib/youTubeNavigationUrlType";
import { ReportSummarizer, YouTubeNavigation } from "./ReportSummarizer";

export interface YouTubeUsageStatisticsUpdate {
  amount_of_days_with_at_least_one_youtube_visit: number;
  amount_of_time_with_an_active_youtube_tab: number;
  amount_of_youtube_watch_pages_loaded: AmountsByCategory;
  amount_of_days_with_at_least_one_youtube_watch_page_load: AmountsByCategory;
  amount_of_time_with_an_active_youtube_watch_page_tab: AmountsByCategory;
  amount_of_days_of_at_least_one_video_played_on_a_youtube_watch_page: AmountsByCategory;
  amount_of_youtube_videos_played_on_youtube_watch_pages: AmountsByCategory;
  amount_of_youtube_video_play_time: number;
  amount_of_youtube_video_play_time_on_youtube_watch_pages: AmountsByCategory;
}

interface AmountsByCategory {
  in_total: number;
  via_search_results: number;
  via_non_search_algorithmic_recommendations_content: number;
  via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: number;
}

interface AmountsByStringAttribute {
  [stringAttribute: string]: number;
}

interface DatesByCategory {
  in_total: string[];
  via_search_results: string[];
  via_non_search_algorithmic_recommendations_content: string[];
  via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: string[];
}

interface AmountsByCategoryAndStringAttribute {
  in_total: AmountsByStringAttribute;
  via_search_results: AmountsByStringAttribute;
  via_non_search_algorithmic_recommendations_content: AmountsByStringAttribute;
  via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: AmountsByStringAttribute;
}

interface YouTubeUsageStatisticsRegistry {
  dates_with_at_least_one_youtube_visit: string[];
  amount_of_time_with_an_active_youtube_tab_by_navigation_batch_uuid: AmountsByStringAttribute;
  amount_of_youtube_watch_pages_loaded_by_category_and_navigation_batch_uuid: AmountsByCategoryAndStringAttribute;
  dates_with_at_least_one_youtube_watch_page_load_by_category: DatesByCategory;
  amount_of_time_with_an_active_youtube_watch_page_tab_by_category_and_navigation_batch_uuid: AmountsByCategoryAndStringAttribute;
  dates_with_at_least_one_video_played_on_a_youtube_watch_page_by_category: DatesByCategory;
  amount_of_youtube_videos_played_on_youtube_watch_pages_by_category_and_navigation_batch_uuid: AmountsByCategoryAndStringAttribute;
  amount_of_youtube_video_play_time_by_navigation_batch_uuid: AmountsByStringAttribute;
  amount_of_youtube_video_play_time_on_youtube_watch_pages_by_category_and_navigation_batch_uuid: AmountsByCategoryAndStringAttribute;
}

const emptyAmountsByCategoryAndStringAttributes = (): AmountsByCategoryAndStringAttribute => ({
  in_total: {},
  via_search_results: {},
  via_non_search_algorithmic_recommendations_content: {},
  via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: {},
});
const emptyDatesByCategory = (): DatesByCategory => ({
  in_total: [],
  via_search_results: [],
  via_non_search_algorithmic_recommendations_content: [],
  via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: [],
});
const emptyAmountsByCategory = (): AmountsByCategory => ({
  in_total: 0,
  via_search_results: 0,
  via_non_search_algorithmic_recommendations_content: 0,
  via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for: 0,
});

export class YouTubeUsageStatistics implements YouTubeUsageStatisticsRegistry {
  public store: Store;
  public reportSummarizer: ReportSummarizer;
  public dates_with_at_least_one_youtube_visit: string[];
  public amount_of_time_with_an_active_youtube_tab_by_navigation_batch_uuid: AmountsByStringAttribute;
  public amount_of_youtube_watch_pages_loaded_by_category_and_navigation_batch_uuid: AmountsByCategoryAndStringAttribute;
  public dates_with_at_least_one_youtube_watch_page_load_by_category: DatesByCategory;
  public amount_of_time_with_an_active_youtube_watch_page_tab_by_category_and_navigation_batch_uuid: AmountsByCategoryAndStringAttribute;
  public dates_with_at_least_one_video_played_on_a_youtube_watch_page_by_category: DatesByCategory;
  public amount_of_youtube_videos_played_on_youtube_watch_pages_by_category_and_navigation_batch_uuid: AmountsByCategoryAndStringAttribute;
  public amount_of_youtube_video_play_time_by_navigation_batch_uuid: AmountsByStringAttribute;
  public amount_of_youtube_video_play_time_on_youtube_watch_pages_by_category_and_navigation_batch_uuid: AmountsByCategoryAndStringAttribute;
  constructor(store: Store, reportSummarizer: ReportSummarizer) {
    this.store = store;
    this.reportSummarizer = reportSummarizer;
  }

  seenNavigationBatch = async (
    navigationBatch: NavigationBatch,
  ): Promise<void> => {
    if (!this.hydrated) {
      throw new Error("Instance not hydrated");
    }
    const navigationBatchByUuid = {};
    const navigationBatchUuid =
      navigationBatch.navigationEnvelope.navigation.uuid;
    navigationBatchByUuid[navigationBatchUuid] = navigationBatch;
    const youTubeNavigations = await this.reportSummarizer.navigationBatchesByUuidToYouTubeNavigations(
      navigationBatchByUuid,
    );
    // First clear statistics related to this navigation batch, so that they don't get counted twice
    [
      "amount_of_youtube_watch_pages_loaded_by_category_and_navigation_batch_uuid",
      "amount_of_time_with_an_active_youtube_watch_page_tab_by_category_and_navigation_batch_uuid",
      "amount_of_youtube_videos_played_on_youtube_watch_pages_by_category_and_navigation_batch_uuid",
      "amount_of_youtube_video_play_time_on_youtube_watch_pages_by_category_and_navigation_batch_uuid",
    ].forEach(attribute => {
      [
        "in_total",
        "via_search_results",
        "via_non_search_algorithmic_recommendations_content",
        "via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for",
      ].forEach(category => {
        if (
          typeof this[attribute][category][navigationBatchUuid] !== "undefined"
        ) {
          delete this[attribute][category][navigationBatchUuid];
        }
      });
    });
    [
      "amount_of_time_with_an_active_youtube_tab_by_navigation_batch_uuid",
      "amount_of_youtube_video_play_time_by_navigation_batch_uuid",
    ].forEach(attribute => {
      if (typeof this[attribute][navigationBatchUuid] !== "undefined") {
        delete this[attribute][navigationBatchUuid];
      }
    });
    // Then update the statistics related to this navigation batch
    for (const youTubeNavigation of youTubeNavigations) {
      await this.seenYouTubeNavigation(youTubeNavigation, navigationBatchUuid);
    }
  };

  seenYouTubeNavigation = async (
    youTubeNavigation: YouTubeNavigation,
    navigationBatchUuid: string,
  ): Promise<void> => {
    if (!this.hydrated) {
      throw new Error("Instance not hydrated");
    }
    const dateTime = parseIsoDateTimeString(youTubeNavigation.time_stamp);
    const dateYmd = format(dateTime, "yyyy-MM-dd");
    this.includeDateIfNotAlreadyIncluded(
      this.dates_with_at_least_one_youtube_visit,
      dateYmd,
    );
    this.incrementNavigationBatchAmount(
      this.amount_of_time_with_an_active_youtube_tab_by_navigation_batch_uuid,
      navigationBatchUuid,
      youTubeNavigation.youtube_visit_metadata.document_visible_time,
    );
    if (youTubeNavigation.youtube_visit_metadata.video_element_play_time > 0) {
      this.incrementNavigationBatchAmount(
        this.amount_of_youtube_video_play_time_by_navigation_batch_uuid,
        navigationBatchUuid,
        youTubeNavigation.youtube_visit_metadata.video_element_play_time,
      );
    }
    if (
      classifyYouTubeNavigationUrlType(youTubeNavigation.url) === "watch_page"
    ) {
      this.seenYouTubeWatchPage(
        "in_total",
        dateYmd,
        navigationBatchUuid,
        youTubeNavigation,
      );
      if (
        this.reportSummarizer.viaSearchResultsFromYouTubeNavigation(
          youTubeNavigation,
        ) === 1
      ) {
        this.seenYouTubeWatchPage(
          "via_search_results",
          dateYmd,
          navigationBatchUuid,
          youTubeNavigation,
        );
      }
      if (
        this.reportSummarizer.viaNonSearchAlgorithmicRecommendationsContentFromYouTubeNavigation(
          youTubeNavigation,
        ) === 1
      ) {
        this.seenYouTubeWatchPage(
          "via_non_search_algorithmic_recommendations_content",
          dateYmd,
          navigationBatchUuid,
          youTubeNavigation,
        );
      }
      if (
        this.reportSummarizer.viaRecommendationsWithAnExplicitQueryOrConstraintToOptimizeForFromYouTubeNavigation(
          youTubeNavigation,
        ) === 1
      ) {
        this.seenYouTubeWatchPage(
          "via_recommendations_with_an_explicit_query_or_constraint_to_optimize_for",
          dateYmd,
          navigationBatchUuid,
          youTubeNavigation,
        );
      }
    }
  };

  seenYouTubeWatchPage(
    category,
    dateYmd,
    navigationBatchUuid,
    youTubeNavigation: YouTubeNavigation,
  ) {
    this.includeDateIfNotAlreadyIncluded(
      this.dates_with_at_least_one_youtube_watch_page_load_by_category[
        category
      ],
      dateYmd,
    );
    this.incrementNavigationBatchAmount(
      this
        .amount_of_youtube_watch_pages_loaded_by_category_and_navigation_batch_uuid[
        category
      ],
      navigationBatchUuid,
    );
    this.incrementNavigationBatchAmount(
      this
        .amount_of_time_with_an_active_youtube_watch_page_tab_by_category_and_navigation_batch_uuid[
        category
      ],
      navigationBatchUuid,
      youTubeNavigation.youtube_visit_metadata.document_visible_time,
    );
    if (youTubeNavigation.youtube_visit_metadata.video_element_play_time > 0) {
      this.includeDateIfNotAlreadyIncluded(
        this
          .dates_with_at_least_one_video_played_on_a_youtube_watch_page_by_category[
          category
        ],
        dateYmd,
      );
      this.incrementNavigationBatchAmount(
        this
          .amount_of_youtube_videos_played_on_youtube_watch_pages_by_category_and_navigation_batch_uuid[
          category
        ],
        navigationBatchUuid,
      );
      this.incrementNavigationBatchAmount(
        this
          .amount_of_youtube_video_play_time_on_youtube_watch_pages_by_category_and_navigation_batch_uuid[
          category
        ],
        navigationBatchUuid,
        youTubeNavigation.youtube_visit_metadata.video_element_play_time,
      );
    }
  }

  includeDateIfNotAlreadyIncluded(
    dates: string[],
    dateYmd: string,
    increment: number = 1,
  ) {
    if (!dates.includes(dateYmd)) {
      dates.push(dateYmd);
    }
  }

  incrementNavigationBatchAmount(
    amountsByStringAttribute,
    stringAttribute: string,
    increment: number = 1,
  ) {
    if (typeof amountsByStringAttribute[stringAttribute] === "undefined") {
      amountsByStringAttribute[stringAttribute] = 0;
    }
    amountsByStringAttribute[stringAttribute] =
      amountsByStringAttribute[stringAttribute] + increment;
  }

  /**
   * YouTubeUsageStatisticsRegistry -> YouTubeUsageStatisticsUpdate
   */
  summarizeUpdate = async (): Promise<YouTubeUsageStatisticsUpdate> => {
    if (!this.hydrated) {
      throw new Error("Instance not hydrated");
    }
    const reduceAmountsByStringAttributeToAmount = (
      amountsByStringAttributeToAmount: AmountsByStringAttribute,
    ): number => {
      const strings = Object.keys(amountsByStringAttributeToAmount);
      return strings
        .map(string => amountsByStringAttributeToAmount[string])
        .reduce((a, b) => a + b, 0);
    };
    const reduceAmountsByCategoryAndStringAttributeToAmountsByCategory = (
      object: AmountsByCategoryAndStringAttribute,
    ): AmountsByCategory => {
      const reduced = {} as AmountsByCategory;
      for (const category of Object.keys(object)) {
        reduced[category] = reduceAmountsByStringAttributeToAmount(
          object[category],
        );
      }
      return reduced;
    };
    const reduceDatesByCategoryToAmountsByCategory = (
      object: DatesByCategory,
    ): AmountsByCategory => {
      const reduced = {} as AmountsByCategory;
      for (const category of Object.keys(object)) {
        reduced[category] = object[category] ? object[category].length : 0;
      }
      return reduced;
    };

    const {
      dates_with_at_least_one_youtube_visit,
      amount_of_youtube_watch_pages_loaded_by_category_and_navigation_batch_uuid,
      amount_of_time_with_an_active_youtube_tab_by_navigation_batch_uuid,
      dates_with_at_least_one_youtube_watch_page_load_by_category,
      amount_of_time_with_an_active_youtube_watch_page_tab_by_category_and_navigation_batch_uuid,
      dates_with_at_least_one_video_played_on_a_youtube_watch_page_by_category,
      amount_of_youtube_videos_played_on_youtube_watch_pages_by_category_and_navigation_batch_uuid,
      amount_of_youtube_video_play_time_by_navigation_batch_uuid,
      amount_of_youtube_video_play_time_on_youtube_watch_pages_by_category_and_navigation_batch_uuid,
    } = this;

    const amount_of_days_with_at_least_one_youtube_visit = dates_with_at_least_one_youtube_visit
      ? dates_with_at_least_one_youtube_visit.length
      : 0;
    let amount_of_time_with_an_active_youtube_tab = 0;
    if (amount_of_time_with_an_active_youtube_tab_by_navigation_batch_uuid) {
      amount_of_time_with_an_active_youtube_tab = reduceAmountsByStringAttributeToAmount(
        amount_of_time_with_an_active_youtube_tab_by_navigation_batch_uuid,
      );
    }
    let amount_of_youtube_watch_pages_loaded = emptyAmountsByCategory();
    if (
      amount_of_youtube_watch_pages_loaded_by_category_and_navigation_batch_uuid
    ) {
      amount_of_youtube_watch_pages_loaded = reduceAmountsByCategoryAndStringAttributeToAmountsByCategory(
        amount_of_youtube_watch_pages_loaded_by_category_and_navigation_batch_uuid,
      );
    }
    let amount_of_days_with_at_least_one_youtube_watch_page_load = emptyAmountsByCategory();
    if (dates_with_at_least_one_youtube_watch_page_load_by_category) {
      amount_of_days_with_at_least_one_youtube_watch_page_load = reduceDatesByCategoryToAmountsByCategory(
        dates_with_at_least_one_youtube_watch_page_load_by_category,
      );
    }
    let amount_of_time_with_an_active_youtube_watch_page_tab = emptyAmountsByCategory();
    if (
      amount_of_time_with_an_active_youtube_watch_page_tab_by_category_and_navigation_batch_uuid
    ) {
      amount_of_time_with_an_active_youtube_watch_page_tab = reduceAmountsByCategoryAndStringAttributeToAmountsByCategory(
        amount_of_time_with_an_active_youtube_watch_page_tab_by_category_and_navigation_batch_uuid,
      );
    }
    let amount_of_days_of_at_least_one_video_played_on_a_youtube_watch_page = emptyAmountsByCategory();
    if (
      dates_with_at_least_one_video_played_on_a_youtube_watch_page_by_category
    ) {
      amount_of_days_of_at_least_one_video_played_on_a_youtube_watch_page = reduceDatesByCategoryToAmountsByCategory(
        dates_with_at_least_one_video_played_on_a_youtube_watch_page_by_category,
      );
    }
    let amount_of_youtube_videos_played_on_youtube_watch_pages = emptyAmountsByCategory();
    if (
      amount_of_youtube_videos_played_on_youtube_watch_pages_by_category_and_navigation_batch_uuid
    ) {
      amount_of_youtube_videos_played_on_youtube_watch_pages = reduceAmountsByCategoryAndStringAttributeToAmountsByCategory(
        amount_of_youtube_videos_played_on_youtube_watch_pages_by_category_and_navigation_batch_uuid,
      );
    }
    let amount_of_youtube_video_play_time: number = 0;
    if (amount_of_youtube_video_play_time_by_navigation_batch_uuid) {
      amount_of_youtube_video_play_time = reduceAmountsByStringAttributeToAmount(
        amount_of_youtube_video_play_time_by_navigation_batch_uuid,
      );
    }
    let amount_of_youtube_video_play_time_on_youtube_watch_pages = emptyAmountsByCategory();
    if (
      amount_of_youtube_video_play_time_on_youtube_watch_pages_by_category_and_navigation_batch_uuid
    ) {
      amount_of_youtube_video_play_time_on_youtube_watch_pages = reduceAmountsByCategoryAndStringAttributeToAmountsByCategory(
        amount_of_youtube_video_play_time_on_youtube_watch_pages_by_category_and_navigation_batch_uuid,
      );
    }

    return {
      amount_of_days_with_at_least_one_youtube_visit,
      amount_of_time_with_an_active_youtube_tab,
      amount_of_youtube_watch_pages_loaded,
      amount_of_days_with_at_least_one_youtube_watch_page_load,
      amount_of_time_with_an_active_youtube_watch_page_tab,
      amount_of_days_of_at_least_one_video_played_on_a_youtube_watch_page,
      amount_of_youtube_videos_played_on_youtube_watch_pages,
      amount_of_youtube_video_play_time,
      amount_of_youtube_video_play_time_on_youtube_watch_pages,
    };
  };

  private hydrated = false;

  hydrate = async () => {
    const {
      dates_with_at_least_one_youtube_visit,
      amount_of_youtube_watch_pages_loaded_by_category_and_navigation_batch_uuid,
      amount_of_time_with_an_active_youtube_tab_by_navigation_batch_uuid,
      dates_with_at_least_one_youtube_watch_page_load_by_category,
      amount_of_time_with_an_active_youtube_watch_page_tab_by_category_and_navigation_batch_uuid,
      dates_with_at_least_one_video_played_on_a_youtube_watch_page_by_category,
      amount_of_youtube_videos_played_on_youtube_watch_pages_by_category_and_navigation_batch_uuid,
      amount_of_youtube_video_play_time_by_navigation_batch_uuid,
      amount_of_youtube_video_play_time_on_youtube_watch_pages_by_category_and_navigation_batch_uuid,
    } = await this.store.get([
      "dates_with_at_least_one_youtube_visit",
      "amount_of_youtube_watch_pages_loaded_by_category_and_navigation_batch_uuid",
      "amount_of_time_with_an_active_youtube_tab_by_navigation_batch_uuid",
      "dates_with_at_least_one_youtube_watch_page_load_by_category",
      "amount_of_time_with_an_active_youtube_watch_page_tab_by_category_and_navigation_batch_uuid",
      "dates_with_at_least_one_video_played_on_a_youtube_watch_page_by_category",
      "amount_of_youtube_videos_played_on_youtube_watch_pages_by_category_and_navigation_batch_uuid",
      "amount_of_youtube_video_play_time_by_navigation_batch_uuid",
      "amount_of_youtube_video_play_time_on_youtube_watch_pages_by_category_and_navigation_batch_uuid",
    ]);
    this.dates_with_at_least_one_youtube_visit =
      dates_with_at_least_one_youtube_visit || [];
    this.amount_of_youtube_watch_pages_loaded_by_category_and_navigation_batch_uuid =
      amount_of_youtube_watch_pages_loaded_by_category_and_navigation_batch_uuid ||
      emptyAmountsByCategoryAndStringAttributes();
    this.amount_of_time_with_an_active_youtube_tab_by_navigation_batch_uuid =
      amount_of_time_with_an_active_youtube_tab_by_navigation_batch_uuid || {};
    this.dates_with_at_least_one_youtube_watch_page_load_by_category =
      dates_with_at_least_one_youtube_watch_page_load_by_category ||
      emptyDatesByCategory();
    this.amount_of_time_with_an_active_youtube_watch_page_tab_by_category_and_navigation_batch_uuid =
      amount_of_time_with_an_active_youtube_watch_page_tab_by_category_and_navigation_batch_uuid ||
      emptyAmountsByCategoryAndStringAttributes();
    this.dates_with_at_least_one_video_played_on_a_youtube_watch_page_by_category =
      dates_with_at_least_one_video_played_on_a_youtube_watch_page_by_category ||
      emptyDatesByCategory();
    this.amount_of_youtube_videos_played_on_youtube_watch_pages_by_category_and_navigation_batch_uuid =
      amount_of_youtube_videos_played_on_youtube_watch_pages_by_category_and_navigation_batch_uuid ||
      emptyAmountsByCategoryAndStringAttributes();
    this.amount_of_youtube_video_play_time_by_navigation_batch_uuid =
      amount_of_youtube_video_play_time_by_navigation_batch_uuid || {};
    this.amount_of_youtube_video_play_time_on_youtube_watch_pages_by_category_and_navigation_batch_uuid =
      amount_of_youtube_video_play_time_on_youtube_watch_pages_by_category_and_navigation_batch_uuid ||
      emptyAmountsByCategoryAndStringAttributes();
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
      amount_of_time_with_an_active_youtube_tab_by_navigation_batch_uuid: this
        .amount_of_time_with_an_active_youtube_tab_by_navigation_batch_uuid,
      amount_of_youtube_watch_pages_loaded_by_category_and_navigation_batch_uuid: this
        .amount_of_youtube_watch_pages_loaded_by_category_and_navigation_batch_uuid,
      dates_with_at_least_one_youtube_watch_page_load_by_category: this
        .dates_with_at_least_one_youtube_watch_page_load_by_category,
      amount_of_time_with_an_active_youtube_watch_page_tab_by_category_and_navigation_batch_uuid: this
        .amount_of_time_with_an_active_youtube_watch_page_tab_by_category_and_navigation_batch_uuid,
      dates_with_at_least_one_video_played_on_a_youtube_watch_page_by_category: this
        .dates_with_at_least_one_video_played_on_a_youtube_watch_page_by_category,
      amount_of_youtube_videos_played_on_youtube_watch_pages_by_category_and_navigation_batch_uuid: this
        .amount_of_youtube_videos_played_on_youtube_watch_pages_by_category_and_navigation_batch_uuid,
      amount_of_youtube_video_play_time_by_navigation_batch_uuid: this
        .amount_of_youtube_video_play_time_by_navigation_batch_uuid,
      amount_of_youtube_video_play_time_on_youtube_watch_pages_by_category_and_navigation_batch_uuid: this
        .amount_of_youtube_video_play_time_on_youtube_watch_pages_by_category_and_navigation_batch_uuid,
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

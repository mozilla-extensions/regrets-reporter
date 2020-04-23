type FailedStringAttribute = "<failed>";

export type YouTubeNavigationUrlType =
  | "search_results_page"
  | "watch_page"
  | "channel_page"
  | "youtube_main_page"
  | "other_page"
  | "misc_xhr"
  | "not_a_youtube_page"
  | "empty"
  | FailedStringAttribute;

export const classifyYouTubeNavigationUrlType = (
  url: string,
): YouTubeNavigationUrlType => {
  if (!url || url === "") {
    return "empty";
  }
  const miscXhrRequestStartWiths = [
    "https://www.youtube.com/comment_service_ajax",
    "https://www.youtube.com/get_video_info",
    "https://www.youtube.com/get_midroll_info",
    "https://www.youtube.com/api/stats",
    "https://www.youtube.com/youtubei/v1/log_event",
    "https://www.youtube.com/youtubei/v1/guide",
    "https://www.youtube.com/youtubei/v1/feedback",
    "https://www.youtube.com/youtubei/v1/related_ajax",
    "https://www.youtube.com/youtubei/v1/notification/get_unseen_count",
    "https://www.youtube.com/error_204",
    "https://www.youtube.com/notifications_ajax",
    "https://www.youtube.com/yts/",
  ];
  for (const startWith of miscXhrRequestStartWiths) {
    if (url.indexOf(startWith) === 0) {
      return "misc_xhr";
    }
  }
  const watchPageStartWiths = ["https://www.youtube.com/watch"];
  for (const startWith of watchPageStartWiths) {
    if (url.indexOf(startWith) === 0) {
      return "watch_page";
    }
  }
  const channelPageStartWiths = ["https://www.youtube.com/channel"];
  for (const startWith of channelPageStartWiths) {
    if (url.indexOf(startWith) === 0) {
      return "channel_page";
    }
  }
  const searchResultsPageStartWiths = [
    "https://www.youtube.com/results?search",
  ];
  for (const startWith of searchResultsPageStartWiths) {
    if (url.indexOf(startWith) === 0) {
      return "search_results_page";
    }
  }
  if (url === "https://www.youtube.com/") {
    return "youtube_main_page";
  }
  return "other_page";
};

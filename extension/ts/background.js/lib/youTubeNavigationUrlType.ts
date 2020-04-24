type FailedStringAttribute = "<failed>";

export type YouTubeNavigationUrlType =
  | "search_results_page"
  | "watch_page"
  | "user_page"
  | "channel_page"
  | "youtube_main_page"
  | "other_page"
  | "misc_xhr"
  | "not_a_youtube_page"
  | "prefetch"
  | "empty"
  | FailedStringAttribute;

export const classifyYouTubeNavigationUrlType = (
  url: string,
): YouTubeNavigationUrlType => {
  if (!url || url === "") {
    return "empty";
  }
  const parsedUrl = new URL(url);
  if (parsedUrl.origin.indexOf("youtube.com") === -1) {
    return "not_a_youtube_page";
  }
  if (url.indexOf("prefetch=1") > 0) {
    return "prefetch";
  }
  const miscXhrRequestStartWiths = [
    "/comment_service_ajax",
    "/get_video_info",
    "/get_midroll_info",
    "/api/stats",
    /*
    "/youtubei/v1/log_event",
    "/youtubei/v1/guide",
    "/youtubei/v1/feedback",
    "/youtubei/v1/related_ajax",
    "/youtubei/v1/notification/get_unseen_count",
    "/youtubei/v1/updated_metadata",
     */
    "/youtubei/v1/",
    /*
    "/live_chat/get_live_chat",
     */
    "/live_chat/",
    "/heartbeat",
    "/error_204",
    "/notifications_ajax",
    "/yts/",
  ];
  for (const startWith of miscXhrRequestStartWiths) {
    if (parsedUrl.pathname.indexOf(startWith) === 0) {
      return "misc_xhr";
    }
  }
  const watchPageStartWiths = ["/watch"];
  for (const startWith of watchPageStartWiths) {
    if (parsedUrl.pathname.indexOf(startWith) === 0) {
      return "watch_page";
    }
  }
  const userPageStartWiths = ["/user"];
  for (const startWith of userPageStartWiths) {
    if (parsedUrl.pathname.indexOf(startWith) === 0) {
      return "user_page";
    }
  }
  const channelPageStartWiths = ["/channel"];
  for (const startWith of channelPageStartWiths) {
    if (parsedUrl.pathname.indexOf(startWith) === 0) {
      return "channel_page";
    }
  }
  const searchResultsPageStartWiths = ["/results"];
  for (const startWith of searchResultsPageStartWiths) {
    if (parsedUrl.pathname.indexOf(startWith) === 0) {
      return "search_results_page";
    }
  }
  if (parsedUrl.pathname === "/") {
    return "youtube_main_page";
  }
  return "other_page";
};

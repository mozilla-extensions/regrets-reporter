type FailedStringAttribute = "<failed>";

export type YouTubeNavigationUrlType =
  | "search_results_page"
  | "search_results_page_load_more_results"
  | "watch_page"
  | "user_page"
  | "channel_page"
  | "youtube_main_page"
  | "other"
  | "misc_xhr"
  | "not_a_youtube_page"
  | "prefetch"
  | "empty"
  | "unknown"
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
  /*
  // any subdomain, eg:
  img.youtube.com
  r3---sn-ab5l6ndy.c.youtube.com/videoplayback
   */
  if (parsedUrl.origin.indexOf(".youtube.com") > -1) {
    return "other";
  }
  if (url.indexOf("prefetch=1") > 0) {
    return "prefetch";
  }
  const miscXhrRequestStartWiths = [
    /*
    "/api/stats",
    */
    "/api",
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
    "/yts/",
  ];
  for (const startWith of miscXhrRequestStartWiths) {
    if (parsedUrl.pathname.indexOf(startWith) === 0) {
      return "misc_xhr";
    }
  }
  /*
  "/comment_service_ajax",
  "/related_ajax",
  "/notifications_ajax",
  "/list_ajax",
  "/browse_ajax",
  "/service_ajax",
   */
  if (parsedUrl.pathname.match(/^\/[a-z_]+_ajax/)) {
    return "misc_xhr";
  }
  /*
  "/get_video_info",
  "/get_midroll_info",
   */
  if (parsedUrl.pathname.match(/^\/get_[a-z_]+_info/)) {
    return "misc_xhr";
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
  const channelPageStartWiths = ["/channel", "/c/", "/snl/"];
  for (const startWith of channelPageStartWiths) {
    if (parsedUrl.pathname.indexOf(startWith) === 0) {
      return "channel_page";
    }
  }
  const searchResultsPageStartWith = "/results";
  if (parsedUrl.pathname.indexOf(searchResultsPageStartWith) === 0) {
    if (parsedUrl.search.indexOf("&continuation=") > 0) {
      return "search_results_page_load_more_results";
    }
    return "search_results_page";
  }
  /*
  /feed/trending
  /feed/subscriptions
  /feed/library
  /feed/history
  /feed/guide_builder
  */
  const youTubeMainPageStartWiths = ["/feed/"];
  for (const startWith of youTubeMainPageStartWiths) {
    if (parsedUrl.pathname.indexOf(startWith) === 0) {
      return "youtube_main_page";
    }
  }
  if (parsedUrl.pathname === "/") {
    return "youtube_main_page";
  }
  const otherRequestStartWiths = [
    "/about",
    "/playlist",
    "/accounts",
    "/redirect",
    "/premium",
    "/reporthistory",
    "/account",
    "/ptracking",
  ];
  for (const startWith of otherRequestStartWiths) {
    if (parsedUrl.pathname.indexOf(startWith) === 0) {
      return "other";
    }
  }
  return "unknown";
};

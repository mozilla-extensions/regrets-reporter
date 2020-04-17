export type YouTubeNavigationUrlType =
  | "search_results_page"
  | "watch_page"
  | "channel_page"
  | "other_page"
  | "not_a_youtube_page";

export const classifyYouTubeNavigationUrlType = (
  url: string,
): YouTubeNavigationUrlType => {
  return "other_page";
};

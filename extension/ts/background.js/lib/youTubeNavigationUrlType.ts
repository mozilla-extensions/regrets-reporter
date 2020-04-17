type FailedStringAttribute = "<failed>";

export type YouTubeNavigationUrlType =
  | "search_results_page"
  | "watch_page"
  | "channel_page"
  | "other_page"
  | "not_a_youtube_page"
  | "empty"
  | FailedStringAttribute;

export const classifyYouTubeNavigationUrlType = (
  url: string,
): YouTubeNavigationUrlType => {
  if (!url || url === "") {
    return "empty";
  }
  return "other_page";
};

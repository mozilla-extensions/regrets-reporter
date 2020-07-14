import * as React from "react";
import { Component } from "react";
import {
  YouTubeNavigationMetadata,
  YouTubeVisitMetadata,
} from "../background.js/ReportSummarizer";
import { YouTubeNavigationUrlType } from "../background.js/lib/youTubeNavigationUrlType";

export interface TimeLineElementProps {
  youTubeNavigationMetadata: YouTubeNavigationMetadata;
}

export interface TimeLineElementState {}

const youTubeNavigationUrlTypeLabels: {
  [k in YouTubeNavigationUrlType]: string;
} = {
  search_results_page: "Search Results",
  search_results_page_load_more_results: "Load More Search Results",
  watch_page: "Video Page",
  user_page: "User Page",
  channel_page: "Channel Page",
  other: "Other Page",
  unknown: "Unknown Page",
  youtube_main_page: "YouTube.com",
  misc_xhr: "Misc XHR Request",
  not_a_youtube_page: "Somewhere outside of YouTube",
  empty: "(Empty)",
  prefetch: "(Pre-fetch)",
  "<failed>": "(Unknown Page)",
};

export class TimeLineElement extends Component<
  TimeLineElementProps,
  TimeLineElementState
> {
  render() {
    const { youTubeNavigationMetadata } = this.props;
    return (
      <>
        {(youTubeNavigationMetadata.video_metadata && (
          <li
            className="flex"
            title={youTubeNavigationMetadata.video_metadata.video_title}
          >
            <img
              className="flex-none h-9 w-15 mr-3"
              src={`https://img.youtube.com/vi/${youTubeNavigationMetadata.video_metadata.video_id}/mqdefault.jpg`}
              alt=""
            />
            <div className="flex-1 text-sm h-9 overflow-y-hidden leading-tight">
              {youTubeNavigationMetadata.video_metadata.video_title}
            </div>
            <div className="flex-none ml-3 img-icon-close-grey cursor-pointer"></div>
          </li>
        )) || (
          <li className="">
            {youTubeNavigationUrlTypeLabels[youTubeNavigationMetadata.url_type]}
          </li>
        )}
      </>
    );
  }
}

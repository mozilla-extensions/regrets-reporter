import * as React from "react";
import { Component } from "react";
import {
  YouTubeNavigationMetadata,
  YouTubeVisitMetadata,
} from "../background.js/ReportSummarizer";
import { YouTubeNavigationUrlType } from "../background.js/lib/youTubeNavigationUrlType";

export interface TimeLineElementProps {
  youTubeNavigationMetadata: YouTubeNavigationMetadata;
  position: number;
  removed?: boolean;
  bold?: boolean;
  editable?: boolean;
  onEdit?: (position: number, removed: boolean) => Promise<void>;
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
  remove = () => {
    return this.props.onEdit(this.props.position, true);
  };

  restore = () => {
    return this.props.onEdit(this.props.position, false);
  };

  render() {
    const { youTubeNavigationMetadata, removed, bold, editable } = this.props;
    return (
      <>
        {(youTubeNavigationMetadata.video_metadata && (
          <li
            className="flex"
            title={youTubeNavigationMetadata.video_metadata.video_title}
          >
            <img
              className={`flex-none h-9 w-15 mr-3 ${
                removed ? "opacity-10" : ""
              }`}
              src={`https://img.youtube.com/vi/${youTubeNavigationMetadata.video_metadata.video_id}/mqdefault.jpg`}
              alt=""
            />
            <div className="flex-1 text-sm h-9 overflow-y-hidden leading-tight flex items-center">
              <span
                className={`max-h-9 ${bold ? "font-bold" : ""} ${
                  removed ? "opacity-10" : ""
                }`}
              >
                {youTubeNavigationMetadata.video_metadata.video_title}
              </span>
            </div>
            {editable && !removed && (
              <div
                onClick={this.remove}
                className="flex-none ml-3 mb-0.5 img-icon-close-grey cursor-pointer"
              />
            )}
            {removed && (
              <div className="absolute w-full h-9 flex items-center text-xxs font-sans font-bold text-red justify-between">
                <div className="flex-1 flex justify-center">
                  This video {editable ? "will be" : "was"} removed from the
                  report.
                </div>
                {editable && (
                  <div
                    onClick={this.restore}
                    className="font-normal flex-none cursor-pointer text-3xs"
                  >
                    UNDO
                  </div>
                )}
              </div>
            )}
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

import * as React from "react";
import { Component } from "react";
import { YouTubeNavigationMetadata } from "../background.js/ReportSummarizer";
import "./TimeLine.css";
// import {YouTubeNavigationUrlType} from "../background.js/lib/youTubeNavigationUrlType";
import { TimeLineElement } from "./TimeLineElement";

export interface TimeLineProps {
  youTubeNavigationMetadata: YouTubeNavigationMetadata;
  howTheVideoWasReached: YouTubeNavigationMetadata[];
}

export interface TimeLineState {}

/*
const youTubePageEntryPointLabels: {
  [k in YouTubePageEntryPoint]: string;
} = {
  direct_navigation: "Direct visit",
  page_reload: "Direct visit",
  search_results_page: "Search Results",
  watch_page: "Video Page",
  user_page: "User Page",
  channel_page: "Channel Page",
  other: "Other",
  youtube_main_page: "YouTube.com",
  not_a_youtube_page: "Somewhere outside of YouTube",
  "<failed>": "(Unknown)",
};

 */

export class TimeLine extends Component<TimeLineProps, TimeLineState> {
  render() {
    const { howTheVideoWasReached, youTubeNavigationMetadata } = this.props;
    const oldestReachEntry =
      howTheVideoWasReached.slice().shift() || youTubeNavigationMetadata;
    return (
      <div className="timeline">
        <ul className="h-full">
          {/*
          <li className="text-sm">
            {
              youTubePageEntryPointLabels[
                oldestReachEntry.page_entry_point
                ]
            }
          </li>
          */}
          {howTheVideoWasReached.map(
            (
              youTubeNavigationMetadata: YouTubeNavigationMetadata,
              index: number,
            ) => (
              <TimeLineElement
                key={index}
                youTubeNavigationMetadata={youTubeNavigationMetadata}
                editable={true}
              />
            ),
          )}
        </ul>
      </div>
    );
  }
}

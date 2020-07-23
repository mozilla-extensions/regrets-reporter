import * as React from "react";
import { Component } from "react";
import { YouTubeNavigationMetadata } from "../background.js/ReportSummarizer";
import "./TimeLine.css";
import { TimeLineElement } from "./TimeLineElement";

export interface TimeLineProps {
  parentYouTubeNavigationsMetadata: YouTubeNavigationMetadata[];
  userRemovedHistoryPositions: number[];
  editable: boolean;
  onEdit?: (position: number, removed: boolean) => Promise<void>;
}

export interface TimeLineState {}

export class TimeLine extends Component<TimeLineProps, TimeLineState> {
  render() {
    const {
      parentYouTubeNavigationsMetadata,
      userRemovedHistoryPositions,
      editable,
      onEdit,
    } = this.props;
    return (
      <div className="timeline">
        <ul className="h-full">
          {parentYouTubeNavigationsMetadata.map(
            (
              youTubeNavigationMetadata: YouTubeNavigationMetadata,
              index: number,
            ) => (
              <TimeLineElement
                key={index}
                youTubeNavigationMetadata={youTubeNavigationMetadata}
                removed={userRemovedHistoryPositions.indexOf(index) > -1}
                position={index}
                editable={editable}
                onEdit={onEdit}
              />
            ),
          )}
        </ul>
      </div>
    );
  }
}

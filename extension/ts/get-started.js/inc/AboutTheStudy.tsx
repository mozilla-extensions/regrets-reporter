import * as React from "react";
import { Component } from "react";

export interface AboutTheStudyProps {}

export interface AboutTheStudyState {}

export class AboutTheStudy extends Component<
  AboutTheStudyProps,
  AboutTheStudyState
> {
  render() {
    return (
      <section className="program-description">
        <p className="callout">
          Mozilla wants YouTube to recommend less content that users regret
          watching.
        </p>
        <p>
          In order to achieve this, we need your help to collect and analyze
          data about videos that you regret watching on YouTube. We would like
          to confirm that you are willing to share your regretful experiences
          and anonymous YouTube usage statistics with us so that we in turn can
          inform regulators, journalists and YouTube employees on the state of
          regretful content on YouTube.
        </p>
        <p>
          Some data collection will happen in the background while you use
          Firefox to browse YouTube. You will also need to report videos that
          you regret watching (see below).
        </p>
        <p>
          <strong>Participation is strictly voluntary.</strong>
        </p>
      </section>
    );
  }
}

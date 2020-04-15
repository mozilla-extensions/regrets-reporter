import * as React from "react";
import { Component } from "react";
import { EnrollFlowButton } from "./EnrollFlowButton";

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
          Mozilla wants to get better insights into YouTube's problem with
          harmful content and recommendations.
        </p>
        <p>
          In order to achieve this, we need to collect and analyze data about
          YouTube usage statistics. We would like to confirm that you are
          willing to share this information with us. Data collection will happen
          in the background while you use Firefox to browse YouTube.
        </p>
        <p>
          <strong>Participation in the study is strictly voluntary.</strong>
        </p>
      </section>
    );
  }
}

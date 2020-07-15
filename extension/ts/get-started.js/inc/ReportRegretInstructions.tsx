import * as React from "react";
import { Component } from "react";

export interface ReportRegretInstructionsProps {}

export interface ReportRegretInstructionsState {}

export class ReportRegretInstructions extends Component<
  ReportRegretInstructionsProps,
  ReportRegretInstructionsState
> {
  render() {
    return (
      <section>
        <h2>Reporting a "YouTube Regret"</h2>
        <div>It’s easy! Just follow these 3 steps.</div>
        <ul className="flex">
          <li>Click the extension icon in the browser bar</li>
          <li>Report the video and recommendations that led you to it</li>
          <li>Send any extra details you would like Mozilla to know</li>
        </ul>
      </section>
    );
  }
}

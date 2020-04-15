import * as React from "react";
import { Component } from "react";
import "photon-colors/photon-colors.css";
import "../components/photon-components-web/index.css";
import "../components/photon-components-web/attributes";
import "../components/tailwind.css";

export interface ReportRegretInstructionsProps {}

export interface ReportRegretInstructionsState {}

export class ReportRegretInstructions extends Component<
  ReportRegretInstructionsProps,
  ReportRegretInstructionsState
> {
  render() {
    return (
      <section className="program-instructions">
        <h2 className="program-header">Reporting a "YouTube Regret":</h2>
        <ol className="consent-form-list">
          <li>
            Click the [icon description] icon in the browser bar:
            <br />
            <img
              className="instruction-form my-6"
              src="./img/instruction-icon.png"
              alt="Image of icon"
            />
          </li>
          <li>
            Fill out the form:
            <br />
            <img
              className="instruction-form my-6 max-w-xl"
              src="./img/instruction-form.png"
              alt="Image of report regret form"
            />
          </li>
          <li>Click “Report”</li>
        </ol>
      </section>
    );
  }
}

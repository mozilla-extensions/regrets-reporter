import * as React from "react";
import { MouseEvent } from "react";
import { DoorHanger } from "./DoorHanger";
import { config } from "../config";

export class DisplayError extends React.Component<
  {
    message?: string;
    eventId?: string;
  },
  {}
> {
  constructor(props) {
    super(props);
  }

  cancel(event: MouseEvent) {
    event.preventDefault();
    window.close();
  }

  render() {
    return (
      <DoorHanger
        title={this.props.message || "An error occurred"}
        loading={false}
      >
        <div className="p-8 border-b border-grey-30 bg-white">
          <div className="text-lg font-serif font-semibold leading-none mb-5">
            Don't worry
          </div>
          <div className="text-base">
            Usually this means that the current YouTube visit started before
            RegretsReporter was installed or reloaded. Reload the YouTube page
            and try opening this again.
          </div>
        </div>

        <div className="p-5 bg-white">
          <div className="text-xs">
            Do you have feedback about the RegretsReporter? We would love to
            hear it.{" "}
            <a
              href={config.feedbackSurveyUrl}
              rel="noreferrer noopener"
              target="_blank"
              className="text-red underline"
            >
              Send us feedback
            </a>
            .
          </div>
        </div>

        <footer className="mt-5">
          <div
            onClick={this.cancel}
            className="cursor-pointer leading-doorhanger-footer-button bg-red hover:bg-red-70 text-white font-sans font-semibold py-1 px-5 text-xl text-center"
          >
            Close
          </div>
        </footer>
      </DoorHanger>
    );
  }
}

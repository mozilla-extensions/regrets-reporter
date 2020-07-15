import * as React from "react";
import { MouseEvent } from "react";
import { DoorHanger } from "./DoorHanger";
import { config } from "../config";
import { Link } from "../shared-resources/photon-components-web/photon-components/Link";
import { browser } from "webextension-polyfill-ts";

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
      <DoorHanger title="Mozilla RegretsReporter" loading={false}>
        <div className="p-8 border-b border-grey-30 bg-white">
          <div className="text-lg font-serif font-semibold leading-none mb-5">
            {this.props.message || "An error occurred"}
          </div>
          <div className="text-base">
            Don't worry. Usually this means that the current YouTube visit
            started before RegretsReporter was installed or reloaded.
          </div>
          <div className="text-base mt-5">
            <span className="italic">
              Hint: Reload the YouTube page and try opening RegretsReporter
              again.
            </span>
          </div>
        </div>

        <div className="p-5 bg-white">
          <div className="text-xs">
            If this problem persists, help us fix it!{" "}
            <a
              href={config.feedbackSurveyUrl}
              rel="noreferrer noopener"
              target="_blank"
              className="text-red underline"
            >
              Send us feedback
            </a>
            . Information about this extension:{" "}
            <Link
              className="inline text-red"
              target="_blank"
              href={browser.runtime.getURL(`get-started/get-started.html`)}
            >
              RegretReporter Instructions
            </Link>
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

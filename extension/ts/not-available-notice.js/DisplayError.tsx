import * as React from "react";
import { MouseEvent } from "react";
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
      <div className="text-xs font-sans p-5 w-32">
        <div>{this.props.message || "An error occurred"}</div>
        <div>
          <a
            className="inline text-red underline"
            target="_blank"
            href={browser.runtime.getURL(`get-started/get-started.html`)}
          >
            View RegretReporter Instructions
          </a>
        </div>
      </div>
    );
  }
}

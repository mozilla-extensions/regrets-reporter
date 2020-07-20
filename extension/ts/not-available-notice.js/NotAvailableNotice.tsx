import * as React from "react";
import { Component } from "react";
import { browser } from "webextension-polyfill-ts";

export interface NotAvailableNoticeProps {}

export interface NotAvailableNoticeState {}

export class NotAvailableNotice extends Component<
  NotAvailableNoticeProps,
  NotAvailableNoticeState
> {
  public state = {};

  render() {
    return (
      <div className="text-xs font-sans p-4 w-73">
        <div>
          RegretsReporter only works on YouTube. Visit YouTube directly to
          report a video.
        </div>
        <div className="mt-2">
          <a
            className="inline text-red underline"
            target="_blank"
            href={browser.runtime.getURL(`get-started/get-started.html`)}
            onClick={() => {
              setTimeout(() => window.close(), 1000);
            }}
          >
            View RegretReporter Instructions
          </a>
        </div>
      </div>
    );
  }
}

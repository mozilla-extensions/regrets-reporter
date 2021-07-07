import * as React from "react";
import { Component } from "react";
import { browser, Runtime } from "webextension-polyfill-ts";
import { getCurrentTab } from "../background.js/lib/getCurrentTab";
import Port = Runtime.Port;

export interface AnnouncementsProps {}

export interface AnnouncementsState {}

export class Announcements extends Component<
  AnnouncementsProps,
  AnnouncementsState
> {
  public state = {};

  private backgroundContextPort: Port;

  async componentDidMount(): Promise<void> {
    // console.log("Connecting to the background script");
    this.backgroundContextPort = browser.runtime.connect(browser.runtime.id, {
      name: "port-from-announcements:component",
    });

    this.backgroundContextPort.postMessage({
      announcementsDisplayed: true,
    });
  }

  render() {
    return (
      <div className="text-xs font-sans p-4 w-73">
        <div className="font-bold">Update!</div>
        <div className="mt-2">
          Using data contributed by 37,380 RegretsReporter users, Mozilla
          recently released findings from the largest-ever crowdsourced
          investigation into harmful recommendations on YouTube.
        </div>
        <div className="mt-2">
          Learn more about what we found{" "}
          <a
            className="inline text-red underline"
            target="_blank"
            href="https://foundation.mozilla.org/regrets"
            onClick={() => {
              setTimeout(() => window.close(), 1000);
            }}
          >
            here
          </a>{" "}
          and{" "}
          <a
            className="inline text-red underline"
            target="_blank"
            href="https://foundation.mozilla.org/newsletter/"
            onClick={() => {
              setTimeout(() => window.close(), 1000);
            }}
          >
            sign up to our email list
          </a>{" "}
          to stay updated about future releases.
        </div>
        <div className="mt-2">
          Mozilla will continue operating RegretsReporter as an independent tool
          for scrutinizing YouTube’s recommendations. We plan to update the
          extension later this year to give you an easier way to access
          YouTube’s user controls to block unwanted recommendations, and will
          continue to publish our analysis and future recommendations.
        </div>
        <div className="mt-2">Thank you for using RegretsReporter!</div>
        <div className="mt-2 font-bold">Trying to report a regret?</div>
        <div className="mt-2">
          RegretsReporter only works on YouTube video pages. Visit a YouTube
          video page to report a video.
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

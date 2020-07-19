import * as React from "react";
import { Component, MouseEvent } from "react";
import "photon-colors/photon-colors.css";
import "../shared-resources/photon-components-web/attributes/index.css";
import "../shared-resources/tailwind.css";
import { YourPrivacy } from "./inc/YourPrivacy";
import { config } from "../config";
import { YouMakeTheInternetHealther } from "./inc/YouMakeTheInternetHealthier";

export interface GetStartedFlowProps {}

export interface GetStartedFlowState {}

export class GetStartedFlow extends Component<
  GetStartedFlowProps,
  GetStartedFlowState
> {
  public state = {};

  cancel(event: MouseEvent) {
    event.preventDefault();
    window.close();
  }

  render() {
    return (
      <>
        <div className="img-get-started-bg absolute" />
        <div className="px-16">
          <div className="mx-auto max-w-2xl grid grid-cols-12 gap-5 font-sans text-xl">
            <div className="col-span-1" />
            <div className="col-span-10">
              <div className="flex flex-col text-center text-white">
                <div className="img-mozilla-logo m-auto mt-12.5 leading-none" />
                <div className="font-changa font-light text-2.25xl mt-4 leading-none">
                  RegretsReporter
                </div>
                <div className="font-changa text-giant mt-21 leading-none">
                  Welcome!
                </div>
                <div className="font-sans font-light text-3xl mt-5 leading-tight">
                  You can now contribute to a body of evidence about regrettable
                  video recommendations on YouTube.
                </div>
              </div>

              <div className="flex flex-col text-center text-white mt-22.5">
                <div className="font-changa text-huge font-light">
                  Reporting a "YouTube Regret"
                </div>
                <div className="font-sans font-light text-2xl mt-3.25 mb-8.75">
                  It’s easy! Just follow these 3 steps.
                </div>
              </div>
            </div>
            <div className="col-span-1" />
            <div className="col-span-4 text-center">
              <div className="img-step-1 m-auto" />
              <div className="mt-11 text-center">
                <div className="m-auto rounded-full bg-red h-11 w-11 text-white font-semibold font-sans text-3xl flex items-center justify-center leading-none pt-1">
                  1
                </div>
              </div>
              <div className="mt-5.25 font-serif font-light text-2.25xl font-light leading-tight">
                Click the extension icon in the browser bar
              </div>
            </div>
            <div className="col-span-4 text-center">
              <div className="img-step-2 m-auto" />
              <div className="mt-11 text-center">
                <div className="m-auto rounded-full bg-red h-11 w-11 text-white font-semibold font-sans text-3xl flex items-center justify-center leading-none pt-1">
                  2
                </div>
              </div>
              <div className="mt-5.25 font-serif font-light text-2.25xl font-light leading-tight">
                Report the video and recommendations that led you to it
              </div>
            </div>
            <div className="col-span-4 text-center">
              <div className="img-step-3 m-auto" />
              <div className="mt-11 text-center">
                <div className="m-auto rounded-full bg-red h-11 w-11 text-white font-semibold font-sans text-3xl flex items-center justify-center leading-none pt-1 pl-0.5">
                  3
                </div>
              </div>
              <div className="mt-5.25 font-serif font-light text-2.25xl font-light leading-tight">
                Send any extra details you would like Mozilla to know
              </div>
            </div>
            <div className="col-span-2" />
            <div className="col-span-8 font-light">
              <section className="mt-24">
                <p>
                  We ask users not to modify their YouTube behavior when using
                  this extension. Don’t seek out regrettable content. Instead,
                  use YouTube as you normally do. That is the only way that we
                  can collectively understand whether YouTube’s problem with
                  recommending regrettable content is improving, and which areas
                  they need to do better on.
                </p>
              </section>

              <YourPrivacy />
              <section className="mt-7">
                <p>
                  For more information, see our{" "}
                  <a
                    href={config.privacyNoticeUrl}
                    target="_blank"
                    className="underline"
                  >
                    full privacy notice
                  </a>
                  .
                </p>
              </section>

              <section className="mt-24 mb-33">
                <h2 className="text-huge font-changa font-light">
                  Removing the Extension
                </h2>
                <p className="mt-4">
                  Users are welcome to opt out at any point by removing the
                  extension:
                </p>
                <ul className="triangle-bullets">
                  <li>
                    Right-click on the toolbar icon and select{" "}
                    <span className="font-semibold">Remove Extension</span>.
                  </li>
                </ul>

                <p className="mt-4">
                  Removing the extension will stop all ongoing data collection,
                  only your already contributed data will be available to our
                  researchers. For more information, please read our{" "}
                  <a
                    href={config.privacyNoticeUrl}
                    target="_blank"
                    className="underline"
                  >
                    full privacy notice
                  </a>
                  .
                </p>
              </section>
            </div>
            <div className="col-span-2" />
          </div>
        </div>
        <div className="w-full bg-black text-white">
          <div className="mx-auto max-w-2xl grid grid-cols-12 gap-5 font-sans text-xl mt-8.75">
            <div className="col-span-2" />
            <div className="col-span-8">
              <YouMakeTheInternetHealther />
              <div className="img-mozilla-logo m-auto my-35" />
            </div>
            <div className="col-span-2" />
          </div>
        </div>
      </>
    );
  }
}

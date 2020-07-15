import * as React from "react";
import { Component, MouseEvent } from "react";
import "photon-colors/photon-colors.css";
import "../shared-resources/photon-components-web/attributes/index.css";
import "../shared-resources/tailwind.css";
import { ReportRegretInstructions } from "./inc/ReportRegretInstructions";
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
      <div>
        <div>
          <header>
            <div className="m-auto">
              <img
                className="img-mozilla-regrets-reporter"
                alt="Mozilla RegretsReporter"
              />
            </div>
            <div>Welcome!</div>
            <div>
              You can now contribute to a body of evidence about regrettable
              video recommendations on YouTube.
            </div>
          </header>
          <div>
            <ReportRegretInstructions />

            <section>
              <h2>Don't change your YouTube behavior</h2>
              <p>
                We ask users not to modify their YouTube behavior when using
                this extension. Don’t seek out regrettable content. Instead, use
                YouTube as you normally do. That is the only way that we can
                collectively understand whether YouTube’s problem with
                recommending regrettable content is improving, and which areas
                they need to do better on.
              </p>
            </section>

            <YourPrivacy />
            <section>
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

            <section>
              <h2>Uninstalling</h2>
              <p>
                Users are welcome to opt out at any point by uninstalling the
                extension:
              </p>
              <ul>
                <li>
                  Right-click on the toolbar icon and select{" "}
                  <span className="font-semibold">Remove Extension</span>.
                </li>
              </ul>

              <p>
                Uninstalling the extension will stop all ongoing data
                collection, only your already contributed data will be available
                to our researchers. For more information, please read our{" "}
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

            <YouMakeTheInternetHealther />
          </div>
          <footer>
            <img className="img-mozilla-logo m-auto" src="./img/mozilla.svg" />
          </footer>
        </div>
      </div>
    );
  }
}

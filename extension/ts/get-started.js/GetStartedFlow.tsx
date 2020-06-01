import * as React from "react";
import { Component, MouseEvent } from "react";
import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import "photon-colors/photon-colors.css";
import "../shared-resources/photon-components-web/index.css";
import "../shared-resources/photon-components-web/attributes";
import "../shared-resources/tailwind.css";
import { EnrollFlowButton } from "./inc/EnrollFlowButton";
import { ConsentStatus } from "../background.js/Store";
import { ReportRegretInstructions } from "./inc/ReportRegretInstructions";
import { AboutTheStudy } from "./inc/AboutTheStudy";
import { YourPrivacy } from "./inc/YourPrivacy";
import { YouMakeTheInternetHealther } from "./inc/YouMakeTheInternetHealther";
import { config } from "../config";

export interface GetStartedFlowProps {}

export interface GetStartedFlowState {
  loading: boolean;
  consentStatus: ConsentStatus;
}

export class GetStartedFlow extends Component<
  GetStartedFlowProps,
  GetStartedFlowState
> {
  public state = {
    loading: true,
    consentStatus: null,
  };

  private backgroundContextPort: Port;

  componentDidMount(): void {
    this.backgroundContextPort = browser.runtime.connect(browser.runtime.id, {
      name: "port-from-get-started",
    });

    // Send a request to gather the current consent status
    this.backgroundContextPort.postMessage({
      requestConsentStatus: true,
    });

    // When we have received consent status, update state to reflect it
    this.backgroundContextPort.onMessage.addListener(
      (m: { consentStatus: ConsentStatus }) => {
        // console.log("get-started message from backgroundContextPort", { m });
        const { consentStatus } = m;
        this.setState({
          loading: false,
          consentStatus,
        });
      },
    );
  }

  cancel(event: MouseEvent) {
    event.preventDefault();
    window.close();
  }

  onEnroll = async ({ userPartOfMarginalizedGroup }) => {
    const consentStatus = "given";
    this.setState({
      loading: false,
      consentStatus,
    });
    this.backgroundContextPort.postMessage({
      updatedConsentStatus: consentStatus,
      userPartOfMarginalizedGroup,
    });
  };

  report = async (event: MouseEvent) => {
    event.preventDefault();
    window.close();
  };

  render() {
    if (this.state.loading) {
      return null;
    }
    return (
      <div
        className={`app-container ${
          this.state.consentStatus ? "enrolled" : "not-enrolled"
        }`}
      >
        <div className="page-container">
          <header>
            <div className="layout-wrapper p-12 m-auto">
              <img className="wordmark" src="./img/mozilla.svg" alt="Mozilla" />
            </div>
          </header>
          <div className="banner">
            <div className="layout-wrapper px-12 m-auto">
              <div className="icon-container hidden md:block">
                <img
                  className="icon h-16 m-4 mb-8"
                  src="./img/green-extensionsicon.svg"
                />
              </div>
              <div className="text-2xl sm:text-3xl md:text-5xl font-bold ">
                {(!this.state.consentStatus &&
                  "RegretsReporter: Enrollment") ||
                  "You have enrolled. Welcome!"}
              </div>
            </div>
          </div>
          <div className="layout-wrapper px-12 m-auto">
            {!this.state.consentStatus && (
              <>
                <AboutTheStudy />
                <YourPrivacy />
                <section className="program-description">
                  <EnrollFlowButton
                    loading={this.state.loading}
                    consentStatus={this.state.consentStatus}
                    onEnroll={this.onEnroll}
                  />
                </section>
              </>
            )}
            <section className="program-instructions">
              {(this.state.consentStatus && (
                <h2 className="program-header">Next Steps</h2>
              )) || (
                <>
                  <h2 className="program-header">What Will Happen Next</h2>
                  <p>
                    <strong>If you agree</strong> to participate:
                  </p>
                </>
              )}
              <ol className="get-started-list">
                <li>
                  A message{" "}
                  {(this.state.consentStatus && "has been") || "will be"} sent
                  to Mozilla to note that you are (anonymously) willing to
                  participate in the study.
                </li>
                <li>
                  Periodically, aggregated information about your YouTube
                  browsing behavior will be sent to Mozilla.
                </li>
                <li>
                  Continue using Firefox as you normally would, and whenever you{" "}
                  <strong>regret watching a specific YouTube video</strong>, you
                  should follow the steps below to report it to our researchers.
                </li>
                <li>
                  The report will include information about your YouTube
                  browsing behavior up to 5 hours prior to initiating the
                  report. This includes what kind of YouTube pages you have
                  visited and how you interacted with them.
                </li>
              </ol>
            </section>
            <ReportRegretInstructions />
            {this.state.consentStatus && (
              <>
                <section className="program-description">
                  <h2 className="program-header">About the study</h2>
                </section>
                <AboutTheStudy />
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
              </>
            )}
            <section className="program-leaving">
              <h2 className="program-header">Leaving the study</h2>
              <p>Users are welcome to opt out of the study at any point.</p>
              <p>To stop participating in the study:</p>
              <ol className="get-started-list">
                <li>
                  Type <code>about:addons</code> into the location bar and press{" "}
                  <code>Enter</code>.
                </li>
                <li>
                  If you see an addon called{" "}
                  <code>RegretsReporter</code>, click{" "}
                  <strong>Remove</strong>.
                </li>
                <li>
                  Opting out of the study will immediately stop all ongoing data
                  collection.
                </li>
              </ol>

              <p>
                Leaving the study will not cause your historic study data to be
                deleted. For more information, please read our{" "}
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
            <section className="program-thanks">
              <EnrollFlowButton
                loading={this.state.loading}
                consentStatus={this.state.consentStatus}
                onEnroll={this.onEnroll}
              />
            </section>
          </div>
          <footer className="footer">
            <img className="mozilla-logo m-auto" src="./img/mozilla.svg" />
          </footer>
        </div>
      </div>
    );
  }
}

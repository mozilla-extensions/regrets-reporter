import * as React from "react";
import { Component, MouseEvent } from "react";
import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import "photon-colors/photon-colors.css";
import "../shared-resources/photon-components-web/index.css";
import "../shared-resources/photon-components-web/attributes";
import "../shared-resources/tailwind.css";
import { SupplyDemographicsButton } from "./inc/SupplyDemographicsButton";
import { UserSuppliedDemographics } from "../background.js/Store";
import { ReportRegretInstructions } from "./inc/ReportRegretInstructions";
import { AboutTheStudy } from "./inc/AboutTheStudy";
import { YourPrivacy } from "./inc/YourPrivacy";
import { YouMakeTheInternetHealther } from "./inc/YouMakeTheInternetHealther";
import { config } from "../config";

export interface GetStartedFlowProps {}

export interface GetStartedFlowState {
  loading: boolean;
  userSuppliedDemographics: UserSuppliedDemographics;
}

export class GetStartedFlow extends Component<
  GetStartedFlowProps,
  GetStartedFlowState
> {
  public state = {
    loading: true,
    userSuppliedDemographics: null,
  };

  private backgroundContextPort: Port;

  componentDidMount(): void {
    this.backgroundContextPort = browser.runtime.connect(browser.runtime.id, {
      name: "port-from-get-started",
    });

    // Send a request to gather the current consent status
    this.backgroundContextPort.postMessage({
      requestUserSuppliedDemographics: true,
    });

    // When we have received user supplied demographics, update state to reflect it
    this.backgroundContextPort.onMessage.addListener(
      (m: { userSuppliedDemographics: UserSuppliedDemographics }) => {
        console.log("get-started message from backgroundContextPort", { m });
        const { userSuppliedDemographics } = m;
        this.setState({
          loading: false,
          userSuppliedDemographics,
        });
      },
    );
  }

  cancel(event: MouseEvent) {
    event.preventDefault();
    window.close();
  }

  onSaveUserSuppliedDemographics = async (
    userSuppliedDemographics: UserSuppliedDemographics,
  ) => {
    this.setState({
      loading: false,
      userSuppliedDemographics,
    });
    this.backgroundContextPort.postMessage({
      updatedUserSuppliedDemographics: userSuppliedDemographics,
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
      <div className={`app-container enrolled`}>
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
                RegretsReporter: Welcome!
              </div>
            </div>
          </div>
          <div className="layout-wrapper px-12 m-auto">
            <section className="program-instructions">
              <h2 className="program-header">Next Steps</h2>
              <ol className="get-started-list">
                <li>
                  <span
                    className={
                      this.state.userSuppliedDemographics.last_updated === null
                        ? ""
                        : "line-through"
                    }
                  >
                    Tell us a bit about yourself (optional):
                  </span>
                  <SupplyDemographicsButton
                    loading={this.state.loading}
                    userSuppliedDemographics={
                      this.state.userSuppliedDemographics
                    }
                    onSaveUserSuppliedDemographics={
                      this.onSaveUserSuppliedDemographics
                    }
                  />
                </li>
                <li>
                  Continue using Firefox as you normally would, and whenever you{" "}
                  <strong>regret watching a specific YouTube video</strong>, you
                  should follow the steps below to report it to our researchers.
                </li>
                <li>
                  Remember, we will periodically share insights based on the
                  anonymous data sent from this extension with regulators,
                  journalists and YouTube employees. Please review the{" "}
                  <a
                    href={config.privacyNoticeUrl}
                    target="_blank"
                    className="underline"
                  >
                    full privacy notice
                  </a>{" "}
                  for more information.
                </li>
              </ol>
            </section>
            <ReportRegretInstructions />
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
                  If you see an addon called <code>RegretsReporter</code>, click{" "}
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
              <SupplyDemographicsButton
                loading={this.state.loading}
                userSuppliedDemographics={this.state.userSuppliedDemographics}
                onSaveUserSuppliedDemographics={
                  this.onSaveUserSuppliedDemographics
                }
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

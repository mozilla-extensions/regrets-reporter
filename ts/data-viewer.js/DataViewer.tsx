import * as React from "react";
import { Component, MouseEvent } from "react";
import "photon-colors/photon-colors.css";
import "../shared-resources/photon-components-web/index.css";
import "../shared-resources/photon-components-web/attributes/index.css";
import "../shared-resources/tailwind.css";
import "./index.css";
import "../shared-resources/photon-components-web/photon-components/Checkbox/light-theme.css";
import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import { DisplayError } from "./DisplayError";
import { captureExceptionWithExtras } from "../shared-resources/ErrorReporting";
import { AnnotatedSharedData } from "../background.js/DataSharer";
import { RegretReportsDataGrid } from "./RegretReportsDataGrid";
import { YouTubeUsageStatisticsUpdateDataGrid } from "./YouTubeUsageStatisticsUpdateDataGrid";
import { DataDeletionRequestDataGrid } from "./DataDeletionRequestDataGrid";

export interface DataViewerProps {}

export interface DataViewerState {
  loading: boolean;
  openTab: number;
  sharedData: AnnotatedSharedData[] | null;
  error: boolean;
}

export class DataViewer extends Component<DataViewerProps, DataViewerState> {
  public state = {
    loading: true,
    openTab: 1,
    sharedData: null,
    error: false,
  };

  private backgroundContextPort: Port;

  async componentDidMount(): Promise<void> {
    // console.log("Connecting to the background script");
    this.backgroundContextPort = browser.runtime.connect(browser.runtime.id, {
      name: "port-from-data-viewer:component",
    });

    this.backgroundContextPort.postMessage({
      exportSharedData: true,
    });

    this.backgroundContextPort.onMessage.addListener(
      async (m: { sharedData?: AnnotatedSharedData[] }) => {
        if (m.sharedData) {
          const { sharedData } = m;
          console.log("Data viewer received shared data", {
            sharedData,
          });
          await this.setState({
            loading: false,
            sharedData,
          });
          return null;
        }
        captureExceptionWithExtras(new Error("Unexpected message"), { m });
        console.error("Unexpected message", { m });
        await this.setState({
          loading: false,
          error: true,
        });
      },
    );
  }

  cancel(event: MouseEvent) {
    event.preventDefault();
    window.close();
  }

  render() {
    if (this.state.error) {
      return <DisplayError />;
    }

    return (
      <>
        <div className="flex-1 text-lg px-5 pb-4 mx-0 mt-4 mb-8 flex flex-col">
          <div className="text-2xl font-semibold">
            RegretsReporter: Collected data
          </div>
          <div className="flex-1 my-4 flex flex-col">
            {((this.state.loading || this.state.sharedData === null) && (
              <div>Loading...</div>
            )) || (
              <>
                <ul className="flex">
                  <li
                    className="mr-1 cursor-pointer"
                    onClick={event => {
                      event.preventDefault();
                      this.setState({ openTab: 1 });
                    }}
                  >
                    <a
                      className={`bg-white inline-block font-semibold outline-none py-2 px-4 ${
                        this.state.openTab === 1
                          ? "border-l border-t border-r rounded-t text-blue-70"
                          : "text-blue-50 hover:text-blue-80"
                      }`}
                      href="#"
                    >
                      Regret Reports
                    </a>
                  </li>
                  <li
                    className="mr-1 cursor-pointer"
                    onClick={event => {
                      event.preventDefault();
                      this.setState({ openTab: 2 });
                    }}
                  >
                    <a
                      className={`bg-white inline-block font-semibold outline-none py-2 px-4 ${
                        this.state.openTab === 2
                          ? "border-l border-t border-r rounded-t text-blue-70"
                          : "text-blue-50 hover:text-blue-80"
                      }`}
                      href="#"
                    >
                      YouTube Usage Statistics
                    </a>
                  </li>
                  <li
                    className="mr-1 cursor-pointer"
                    onClick={event => {
                      event.preventDefault();
                      this.setState({ openTab: 3 });
                    }}
                  >
                    <a
                      className={`bg-white inline-block font-semibold outline-none py-2 px-4 ${
                        this.state.openTab === 3
                          ? "border-l border-t border-r rounded-t text-blue-70"
                          : "text-blue-50 hover:text-blue-80"
                      }`}
                      href="#"
                    >
                      Deletion Requests
                    </a>
                  </li>
                  <li
                    className="mr-1 cursor-pointer"
                    onClick={event => {
                      event.preventDefault();
                      this.setState({ openTab: 4 });
                    }}
                  >
                    <a
                      className={`bg-white inline-block font-semibold outline-none py-2 px-4 ${
                        this.state.openTab === 4
                          ? "border-l border-t border-r rounded-t text-blue-70"
                          : "text-blue-50 hover:text-blue-80"
                      }`}
                      href="#"
                    >
                      JSON (All data)
                    </a>
                  </li>
                </ul>
                {this.state.openTab === 1 && (
                  <RegretReportsDataGrid
                    regretReportEntries={
                      this.state.sharedData &&
                      this.state.sharedData.filter(entry => entry.regret_report)
                    }
                  />
                )}
                {this.state.openTab === 2 && (
                  <YouTubeUsageStatisticsUpdateDataGrid
                    regretReportEntries={
                      this.state.sharedData &&
                      this.state.sharedData.filter(
                        entry => entry.youtube_usage_statistics_update,
                      )
                    }
                  />
                )}
                {this.state.openTab === 3 && (
                  <DataDeletionRequestDataGrid
                    regretReportEntries={
                      this.state.sharedData &&
                      this.state.sharedData.filter(
                        entry => entry.data_deletion_request,
                      )
                    }
                  />
                )}
                {this.state.openTab === 4 && (
                  <pre className="border border-grey-30 p-4">
                    {JSON.stringify(this.state.sharedData, null, 2)}
                  </pre>
                )}
              </>
            )}
          </div>
        </div>
      </>
    );
  }
}

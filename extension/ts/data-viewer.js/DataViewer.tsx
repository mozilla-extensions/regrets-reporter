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

export interface DataViewerProps {}

export interface DataViewerState {
  loading: boolean;
  sharedData: AnnotatedSharedData[] | null;
  error: boolean;
}

export class DataViewer extends Component<DataViewerProps, DataViewerState> {
  public state = {
    loading: true,
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
        <div className="text-lg px-5 py-4 mx-0">
          <div className="text-xl font-semibold">
            RegretsReporter: Collected data
          </div>
          <div className="my-4">
            {((this.state.loading || this.state.sharedData === null) && (
              <div>Loading...</div>
            )) || (
              <>
              <pre>{JSON.stringify(this.state.sharedData, null, 2)}</pre>
              </>
            )}
          </div>
        </div>
      </>
    );
  }
}

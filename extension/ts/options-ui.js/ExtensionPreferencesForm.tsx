import * as React from "react";
import { Component, MouseEvent } from "react";
import "photon-colors/photon-colors.css";
import "../shared-resources/photon-components-web/index.css";
import "../shared-resources/photon-components-web/attributes";
import "../shared-resources/tailwind.css";
import "./index.css";
import { Checkbox } from "../shared-resources/photon-components-web/photon-components/Checkbox";
import "../shared-resources/photon-components-web/photon-components/Checkbox/light-theme.css";
import { browser, Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import { DisplayError } from "../shared-resources/DisplayError";
import { ExtensionPreferences } from "../background.js/Store";

export interface ExtensionPreferencesFormProps {}

export interface ExtensionPreferencesFormState {
  loading: boolean;
  extensionPreferences: ExtensionPreferences | null;
  error: boolean;
  reported: boolean;
}

export class ExtensionPreferencesForm extends Component<
  ExtensionPreferencesFormProps,
  ExtensionPreferencesFormState
> {
  public state = {
    loading: true,
    extensionPreferences: null,
    error: false,
    reported: false,
  };

  private backgroundContextPort: Port;

  async componentDidMount(): Promise<void> {
    // console.log("Connecting to the background script");
    this.backgroundContextPort = browser.runtime.connect(browser.runtime.id, {
      name: "port-from-options-ui",
    });

    this.backgroundContextPort.postMessage({
      requestExtensionPreferences: true,
    });

    this.backgroundContextPort.onMessage.addListener(
      async (m: { extensionPreferences: ExtensionPreferences }) => {
        if (m.extensionPreferences) {
          const { extensionPreferences } = m;
          console.log("Options UI received extension preferences", {
            extensionPreferences,
          });
          await this.setState({
            loading: false,
            extensionPreferences,
          });
          return null;
        }
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

  saveExtensionPreferences = async (
    updatedExtensionPreferences: ExtensionPreferences,
  ) => {
    this.backgroundContextPort.postMessage({
      updatedExtensionPreferences,
    });
  };

  handleEnableErrorReportingChange = async changeEvent => {
    await this.saveExtensionPreferences({
      ...this.state.extensionPreferences,
      enableErrorReporting: !this.state.extensionPreferences
        .enableErrorReporting,
    });
  };

  render() {
    if (this.state.loading || this.state.extensionPreferences === null) {
      return (
        <>
          <div className="panel-section panel-section-formElements p-0 mx-0 my-4">
            <div className="panel-formElements-item">Loading...</div>
          </div>
        </>
      );
    }
    return (
      <>
        <div className="panel-section panel-section-formElements p-0 mx-0 my-4">
          <div className="panel-formElements-item">
            <Checkbox
              label="Allow RegretsReporter to send information about encountered errors to Mozilla"
              value="enable_error_reporting"
              checked={this.state.extensionPreferences.enableErrorReporting}
              onChange={this.handleEnableErrorReportingChange}
            />
          </div>
        </div>
      </>
    );

    if (this.state.error) {
      return <DisplayError />;
    }
  }
}

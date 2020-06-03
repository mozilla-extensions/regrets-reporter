import { initErrorReportingInContentScript } from "../shared-resources/ErrorReporting";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { ErrorBoundary } from "../shared-resources/ErrorBoundary";
import { ExtensionPreferencesForm } from "./ExtensionPreferencesForm";

const init = async () => {
  await initErrorReportingInContentScript("port-from-options-ui:index");
  ReactDOM.render(
    <ErrorBoundary>
      <ExtensionPreferencesForm />
    </ErrorBoundary>,
    document.getElementById("app"),
  );
};
init();

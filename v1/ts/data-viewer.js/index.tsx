import { initErrorReportingInContentScript } from "../shared-resources/ErrorReporting";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { ErrorBoundary } from "../shared-resources/ErrorBoundary";
import { DataViewer } from "./DataViewer";
import { DisplayError } from "./DisplayError";

const init = async () => {
  await initErrorReportingInContentScript("port-from-data-viewer:index");
  ReactDOM.render(
    <ErrorBoundary displayErrorComponent={DisplayError}>
      <DataViewer />
    </ErrorBoundary>,
    document.getElementById("app"),
  );
};
init();

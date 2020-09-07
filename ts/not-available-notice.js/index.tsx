import { initErrorReportingInContentScript } from "../shared-resources/ErrorReporting";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { ErrorBoundary } from "../shared-resources/ErrorBoundary";
import { NotAvailableNotice } from "./NotAvailableNotice";

import "../shared-resources/tailwind.css";
import "./index.css";
import "typeface-nunito-sans";

import { DisplayError } from "./DisplayError";

const init = async () => {
  await initErrorReportingInContentScript(
    "port-from-not-available-notice:index",
  );
  ReactDOM.render(
    <ErrorBoundary displayErrorComponent={DisplayError}>
      <NotAvailableNotice />
    </ErrorBoundary>,
    document.getElementById("app"),
  );
};
init();

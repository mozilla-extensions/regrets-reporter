import { initErrorReportingInContentScript } from "../shared-resources/ErrorReporting";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { ErrorBoundary } from "../shared-resources/ErrorBoundary";
import { ReportRegretForm } from "./ReportRegretForm";
import { DisplayError } from "./DisplayError";

const init = async () => {
  await initErrorReportingInContentScript("port-from-report-regret-form:index");
  ReactDOM.render(
    <ErrorBoundary displayErrorComponent={DisplayError}>
      <ReportRegretForm />
    </ErrorBoundary>,
    document.getElementById("app"),
  );
};
init();

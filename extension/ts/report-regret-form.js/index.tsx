import { Sentry } from "../shared-resources/Sentry";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { ErrorBoundary } from "../shared-resources/ErrorBoundary";
import { ReportRegretForm } from "./ReportRegretForm";

ReactDOM.render(
  <ErrorBoundary>
    <ReportRegretForm />
  </ErrorBoundary>,
  document.getElementById("app"),
);

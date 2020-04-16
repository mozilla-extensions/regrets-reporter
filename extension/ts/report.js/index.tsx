import * as React from "react";
import * as ReactDOM from "react-dom";

import { ErrorBoundary } from "../shared-react-resources/ErrorBoundary";
import { ReportRegretForm } from "./ReportRegretForm";

ReactDOM.render(
  <ErrorBoundary>
    <ReportRegretForm />
  </ErrorBoundary>,
  document.getElementById("app"),
);

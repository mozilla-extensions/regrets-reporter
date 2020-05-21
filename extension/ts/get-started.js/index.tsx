import { Sentry } from "../shared-resources/Sentry";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { ErrorBoundary } from "../shared-resources/ErrorBoundary";
import { ConsentForm } from "./ConsentForm";

ReactDOM.render(
  <ErrorBoundary>
    <ConsentForm />
  </ErrorBoundary>,
  document.getElementById("app"),
);

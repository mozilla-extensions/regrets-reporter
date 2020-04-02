import * as React from "react";
import * as ReactDOM from "react-dom";

import { ErrorBoundary } from "../components/ErrorBoundary";
import { ConsentForm } from "./ConsentForm";

ReactDOM.render(
  <ErrorBoundary>
    <ConsentForm />
  </ErrorBoundary>,
  document.getElementById("app"),
);

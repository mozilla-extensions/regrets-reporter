import { Sentry } from "../shared-resources/Sentry";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { ErrorBoundary } from "../shared-resources/ErrorBoundary";
import { ExtensionPreferencesForm } from "./ExtensionPreferencesForm";

ReactDOM.render(
  <ErrorBoundary>
    <ExtensionPreferencesForm />
  </ErrorBoundary>,
  document.getElementById("app"),
);

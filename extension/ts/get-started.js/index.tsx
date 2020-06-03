import "../shared-resources/ErrorReporting";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { ErrorBoundary } from "../shared-resources/ErrorBoundary";
import { GetStartedFlow } from "./GetStartedFlow";

import "./index.css";

ReactDOM.render(
  <ErrorBoundary>
    <GetStartedFlow />
  </ErrorBoundary>,
  document.getElementById("app"),
);

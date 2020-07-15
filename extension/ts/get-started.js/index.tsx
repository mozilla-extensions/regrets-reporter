import { initErrorReportingInContentScript } from "../shared-resources/ErrorReporting";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { ErrorBoundary } from "../shared-resources/ErrorBoundary";
import { GetStartedFlow } from "./GetStartedFlow";

import "./index.css";
import "typeface-changa";
import "typeface-zilla-slab";
import "typeface-nunito-sans";

import { DisplayError } from "./DisplayError";

const init = async () => {
  await initErrorReportingInContentScript("port-from-get-started:index");
  ReactDOM.render(
    <ErrorBoundary displayErrorComponent={DisplayError}>
      <GetStartedFlow />
    </ErrorBoundary>,
    document.getElementById("app"),
  );
};
init();

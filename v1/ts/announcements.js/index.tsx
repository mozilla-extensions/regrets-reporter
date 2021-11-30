import { initErrorReportingInContentScript } from "../shared-resources/ErrorReporting";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { ErrorBoundary } from "../shared-resources/ErrorBoundary";
import { Announcements } from "./Announcements";

import "../shared-resources/tailwind.css";
import "./index.css";
import "typeface-nunito-sans";

import { DisplayError } from "./DisplayError";

const init = async () => {
  await initErrorReportingInContentScript("port-from-announcements:index");
  ReactDOM.render(
    <ErrorBoundary displayErrorComponent={DisplayError}>
      <Announcements />
    </ErrorBoundary>,
    document.getElementById("app"),
  );
};
init();

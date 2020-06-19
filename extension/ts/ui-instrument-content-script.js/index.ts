import { initErrorReportingInContentScript } from "../shared-resources/ErrorReporting";
import { injectUiInstrumentPageScript } from "@openwpm/webext-instrumentation";

const init = async () => {
  await initErrorReportingInContentScript(
    "port-from-ui-instrument-content-script:index",
  );
  injectUiInstrumentPageScript(
    (window as any).openWpmUiInstrumentContentScriptConfig || {},
  );
  delete (window as any).openWpmUiInstrumentContentScriptConfig;
};
init();

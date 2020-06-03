import "../shared-resources/ErrorReporting";
import { injectUiInstrumentPageScript } from "@openwpm/webext-instrumentation";

injectUiInstrumentPageScript(
  (window as any).openWpmUiInstrumentContentScriptConfig || {},
);
delete (window as any).openWpmUiInstrumentContentScriptConfig;

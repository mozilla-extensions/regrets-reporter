import { Sentry } from "../shared-resources/Sentry";
import { injectUiInstrumentPageScript } from "@openwpm/webext-instrumentation";

injectUiInstrumentPageScript(
  (window as any).openWpmUiInstrumentContentScriptConfig || {},
);
delete (window as any).openWpmUiInstrumentContentScriptConfig;

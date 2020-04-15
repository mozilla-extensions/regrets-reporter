import { injectUserInteractionInstrumentPageScript } from "@openwpm/webext-instrumentation";

injectUserInteractionInstrumentPageScript(
  (window as any).openWpmUserInteractionInstrumentContentScriptConfig || {},
);
delete (window as any).openWpmUserInteractionInstrumentContentScriptConfig;

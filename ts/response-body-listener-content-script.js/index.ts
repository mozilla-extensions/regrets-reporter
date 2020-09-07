// import { initErrorReportingInContentScript } from "../shared-resources/ErrorReporting";
import { injectResponseBodyListenerPageScript } from "../shared-resources/openwpm-webext-instrumentation";

const init = async () => {
  /*
  await initErrorReportingInContentScript(
    "port-from-response-body-listener-content-script:index",
  );
  */
  injectResponseBodyListenerPageScript(
    (window as any).openWpmResponseBodyListenerContentScriptConfig || {},
  );
  delete (window as any).openWpmResponseBodyListenerContentScriptConfig;
};
init();

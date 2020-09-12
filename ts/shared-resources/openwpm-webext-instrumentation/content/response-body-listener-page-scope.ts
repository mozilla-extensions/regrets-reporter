// Code below is not a content script: no Firefox APIs should be used
// Also, no webpack/es6 imports except for type definitions
// may be used in this file since the script
// is exported as a page script as a string

export interface OpenWPMInjectedPageScriptResponseInfo {
  source: "page-script-document-outer-html" | "xhook-after-event";
  ordinal: number;
  response: {
    finalUrl: string;
    headers: any;
    data: string | ArrayBuffer;
    [k: string]: any;
  };
}

export const responseBodyListenerPageScript = function() {
  const injection_uuid = document.currentScript.getAttribute(
    "data-injection-uuid",
  );

  // To keep track of the original order of events
  let ordinal = 0;

  // messages the injected script
  function sendMessagesToLogger(messages) {
    const loggerEvent = new CustomEvent(injection_uuid, {
      detail: messages,
    });
    try {
      const cancelled = !document.dispatchEvent(loggerEvent);
      if (cancelled) {
        console.error("OpenWPM custom event dispatch cancelled");
      }
    } catch (error) {
      console.error(error);
    }
  }

  const testing =
    document.currentScript.getAttribute("data-testing") === "true";

  if (testing) {
    console.log("OpenWPM: Currently testing");
  }

  /*
   * Start Instrumentation
   */
  const startInstrumentation = () => {
    if (!window.openWpmResponseBodyListenerInstrumentationStarted) {
      // The following is replaced with the minimized version of the xhook library, which we
      // inline here so that we only run it when the instrumentation ought to be started
      // (it pollutes global variables and enables itself by default when included as an external script)
      "XHOOK_MINIMIZED";

      // @ts-ignore
      const xhook = window.xhook;

      // send the closest thing we have to the response body of the document
      const responseInfo: OpenWPMInjectedPageScriptResponseInfo = {
        source: "page-script-document-outer-html",
        ordinal: ordinal++,
        response: {
          finalUrl: window.location.href,
          data: window.document.documentElement.outerHTML,
          headers: null,
        },
      };
      sendMessagesToLogger([responseInfo]);

      xhook.enable();
      xhook.after(function(_request, response) {
        const xhookEventResponseInfo: OpenWPMInjectedPageScriptResponseInfo = {
          source: "xhook-after-event",
          ordinal: ordinal++,
          response: {
            finalUrl: response.finalUrl,
            data: response.data,
            headers: JSON.parse(JSON.stringify(response.headers)),
          },
        };
        sendMessagesToLogger([xhookEventResponseInfo]);
      });
      window.openWpmResponseBodyListenerInstrumentationStarted = true;
      if (testing) {
        console.log(
          "OpenWPM: Content-side response body listener started",
          new Date().toISOString(),
        );
      }
    }
  };

  if (document.body) {
    startInstrumentation();
  } else {
    window.addEventListener("DOMContentLoaded", startInstrumentation);
  }
};

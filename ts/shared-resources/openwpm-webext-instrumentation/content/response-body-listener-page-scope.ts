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

      /**
       * XMLHttpRequest/fetch response body listener inspired by https://github.com/jpillora/xhook
       */
      interface ResponseBodyListenerResponse {
        url: string;
        data: string | ArrayBuffer | null;
        headers: string[];
      }
      const ResponseBodyListener = {
        patch: function(window, onRequestBody) {
          const self = this;

          const _XMLHttpRequest = window.XMLHttpRequest;
          window.XMLHttpRequest = function() {
            const xhr = new _XMLHttpRequest();
            let or = xhr.onreadystatechange;
            xhr.onreadystatechange = function() {
              if (or) {
                or.apply(this, arguments);
              }
              if (xhr.readyState === 4) {
                // console.debug("VIA XHR", { xhr });
                try {
                  const response: ResponseBodyListenerResponse = self.normalizeXhrResponse(
                    xhr,
                  );
                  onRequestBody(response);
                } catch (err) {
                  console.error(err);
                }
              }
            };
            xhr.__defineSetter__("onreadystatechange", function(fn) {
              or = fn;
            });
            return xhr;
          };
          const _fetch = window.fetch;
          window.fetch = function(url, options) {
            return new Promise(function(resolve, reject) {
              const processAfter = function(fetchResponse: Response) {
                // console.debug("VIA FETCH", { fetchResponse });
                resolve(fetchResponse);
                try {
                  self
                    .normalizeFetchResponse(fetchResponse)
                    .then(onRequestBody)
                    .catch(console.error);
                } catch (err) {
                  console.error(err);
                }
              };
              return _fetch(url, options)
                .then(response => processAfter(response))
                .catch(reject);
            });
          };
        },
        readXhrHeaders: function(xhr: XMLHttpRequest) {
          const ABORTED = -1;
          const status = xhr.status;
          const headers = {};
          if (status !== ABORTED) {
            const object = this.normalizeXhrHeaders(
              xhr.getAllResponseHeaders(),
            );
            for (let key in object) {
              const val = object[key];
              if (!headers[key]) {
                const name = key.toLowerCase();
                headers[name] = val;
              }
            }
          }
          return headers;
        },
        normalizeXhrHeaders: function(h: string) {
          let name;
          const dest = {};
          const headers = h.split("\n");
          for (const header of Array.from(headers)) {
            if (/([^:]+):\s*(.+)/.test(header)) {
              name = RegExp.$1 != null ? RegExp.$1.toLowerCase() : undefined;
              const value = RegExp.$2;
              if (dest[name] == null) {
                dest[name] = value;
              }
            }
          }
          return dest;
        },
        normalizeXhrResponse: function(
          xhr: XMLHttpRequest,
        ): ResponseBodyListenerResponse {
          const response = {
            data: null,
            url: null,
            headers: this.readXhrHeaders(xhr),
          };
          if (!xhr.responseType || xhr.responseType === "text") {
            response.data = xhr.responseText;
          } else if (xhr.responseType === "arraybuffer") {
            response.data = xhr.response;
          } else {
            response.data = xhr.response;
          }
          response.url = xhr.responseURL;
          return response;
        },
        normalizeFetchHeaders: function(h: Headers) {
          let headers = {};
          h.forEach((value: string, key: string, parent: Headers) => {
            headers[key] = value;
          });
          return headers;
        },
        normalizeFetchResponse: function(
          fetchResponse: Response,
        ): Promise<ResponseBodyListenerResponse> {
          const self = this;
          return new Promise(function(resolve, reject) {
            try {
              const url = fetchResponse.url;
              const headers = self.normalizeFetchHeaders(fetchResponse.headers);
              fetchResponse
                .clone()
                .text()
                .catch(console.error)
                .then((text: string) => {
                  resolve({
                    url,
                    data: text,
                    headers,
                  });
                });
            } catch (err) {
              console.error(err);
              reject();
            }
          });
        },
      };
      const onRequestBody = (response: ResponseBodyListenerResponse) => {
        // console.debug({ response });
        const xhookEventResponseInfo: OpenWPMInjectedPageScriptResponseInfo = {
          source: "xhook-after-event",
          ordinal: ordinal++,
          response: {
            finalUrl: response.url,
            data: response.data,
            headers: JSON.parse(JSON.stringify(response.headers)),
          },
        };
        sendMessagesToLogger([xhookEventResponseInfo]);
      };
      ResponseBodyListener.patch(window, onRequestBody);
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

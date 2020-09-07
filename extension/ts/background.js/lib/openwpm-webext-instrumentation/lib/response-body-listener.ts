import "content-scripts-register-polyfill";
import RequestFilter = WebRequest.RequestFilter;
import { patternToRegex } from "webext-patterns";
import { browser, Runtime, WebRequest } from "webextension-polyfill-ts";
import ResourceType = WebRequest.ResourceType;
import { OpenWPMResponseInfoSentFromContentScript } from "../content/response-body-listener-content-scope";
import MessageSender = Runtime.MessageSender;
import { WebRequestOnBeforeRequestEventDetails } from "../types/browser-web-request-event-details";
import { PendingResponse } from "./pending-response";
import { sha256Buffer } from "./sha256";

export interface ResponseBodyListenerOptions {
  saveContentViaFilterResponseData?: boolean;
  saveContentViaInjectedPageScript?: boolean;
  requestFilter?: RequestFilter;
}

export class ResponseBodyListener {
  public static async registerContentScript(
    contentScriptConfig: {
      testing: boolean;
    },
    registerContentScriptOptions = {},
  ): Promise<void> {
    if (contentScriptConfig) {
      // TODO: Avoid using window to pass the content script config
      await browser.contentScripts.register({
        js: [
          {
            code: `window.openWpmResponseBodyListenerContentScriptConfig = ${JSON.stringify(
              contentScriptConfig,
            )};`,
          },
        ],
        matches: ["<all_urls>"],
        allFrames: true,
        runAt: "document_start",
        matchAboutBlank: true,
        ...registerContentScriptOptions,
      });
    }
    await browser.contentScripts.register({
      js: [{ file: "/response-body-listener-content-script.js" }],
      matches: ["<all_urls>"],
      allFrames: true,
      runAt: "document_start",
      matchAboutBlank: true,
      ...registerContentScriptOptions,
    });
  }
  private readonly pendingResponse: PendingResponse;
  private readonly responseBody: Promise<Uint8Array>;
  private readonly contentHash: Promise<string>;
  private resolveResponseBody: (responseBody: Uint8Array) => void;
  private resolveContentHash: (contentHash: string) => void;
  private responseBodyPageScriptMessageListener;

  constructor(
    details: WebRequestOnBeforeRequestEventDetails,
    options: ResponseBodyListenerOptions = {},
    pendingResponse: PendingResponse,
    dataReceiver,
  ) {
    this.pendingResponse = pendingResponse;
    this.responseBody = new Promise(resolve => {
      this.resolveResponseBody = resolve;
    });
    this.contentHash = new Promise(resolve => {
      this.resolveContentHash = resolve;
    });

    const {
      saveContentViaFilterResponseData,
      saveContentViaInjectedPageScript,
      requestFilter,
    } = options;

    if (saveContentViaFilterResponseData && saveContentViaInjectedPageScript) {
      throw new Error(
        "Response body listener can only use one method of listening for response bodies",
      );
    }

    if (saveContentViaFilterResponseData) {
      if (!browser.webRequest.filterResponseData) {
        // Tracking issue for Chromium: https://bugs.chromium.org/p/chromium/issues/detail?id=487422
        throw new Error(
          "This browser does not support listening to response bodies via webRequest.filterResponseData",
        );
      }

      // Used to parse Response stream
      const filter: any = browser.webRequest.filterResponseData(
        details.requestId,
      ) as any;

      let responseBody = new Uint8Array();
      filter.ondata = event => {
        sha256Buffer(event.data).then(digest => {
          this.resolveContentHash(digest);
        });
        const incoming = new Uint8Array(event.data);
        const tmp = new Uint8Array(responseBody.length + incoming.length);
        tmp.set(responseBody);
        tmp.set(incoming, responseBody.length);
        responseBody = tmp;
        filter.write(event.data);
      };

      filter.onstop = _event => {
        this.resolveResponseBody(responseBody);
        filter.disconnect();
      };
    } else if (saveContentViaInjectedPageScript) {
      // Check compatibility
      const types = requestFilter.types;
      const unsupportedTypes = types.filter(
        (type: ResourceType) =>
          type !== "main_frame" &&
          type !== "sub_frame" &&
          type !== "xmlhttprequest",
      );
      if (
        unsupportedTypes.length > 0 ||
        !requestFilter.types ||
        requestFilter.types.length === 0
      ) {
        throw new Error(
          "Injected page scripts can only resolve response bodies of main_frame, sub_frame and xmlhttprequest resource types.",
        );
      }

      let requestFilterUrlMatcher = (_url: string) => true;
      if (
        requestFilter.urls &&
        requestFilter.urls.length > 0 &&
        requestFilter.urls.indexOf("<all_urls>") === -1
      ) {
        const regex = patternToRegex(
          ...requestFilter.urls.filter(url => url !== "<all_urls>"),
        );
        requestFilterUrlMatcher = (url: string) => {
          return !!url.match(regex);
        };
      }

      /**
       * Start listening for messages from page/content/background scripts injected to forward response bodies
       */
      if (!this.responseBodyPageScriptMessageListener) {
        const logMsgPrefix = `[Response body listener for request id ${details.requestId}]: `;
        this.responseBodyPageScriptMessageListener = async (
          message: OpenWPMResponseInfoSentFromContentScript,
          sender: MessageSender,
        ) => {
          const { namespace, responseInfo } = message;
          const candidateResponseInfo = responseInfo;

          // console.debug("response-body-listener background listener received a message", {data, namespace, sender, details});
          if (namespace && namespace === "response-body-listener") {
            try {
              // console.debug(logMsgPrefix, "response-body-listener background listener received a response-body-listener-namespaced message", {candidateResponseInfo, sender, details,},);

              // ignore packets from other windows/tabs (or outside windows/tabs)
              if (sender.tab === undefined || details.tabId !== sender.tab.id) {
                return;
              }

              // ignore packets from other frames (or outside frames)
              if (
                details.frameId === undefined ||
                details.frameId !== sender.frameId
              ) {
                return;
              }

              const onCompletedEventDetails = await this.pendingResponse
                .onCompletedEventDetails;
              const responseUrl = onCompletedEventDetails.url;
              const candidateResponseUrl =
                candidateResponseInfo.response.finalUrl;

              // first check via options.filter request filter if we should even consider matching it
              if (!requestFilterUrlMatcher(responseUrl)) {
                return;
              }

              // must match url
              if (responseUrl !== candidateResponseUrl) {
                return;
              }

              const resourceType: ResourceType = onCompletedEventDetails.type;
              switch (resourceType) {
                case "main_frame":
                case "sub_frame":
                  // no headers available to match. matching url have to be enough
                  break;
                case "xmlhttprequest":
                  // match response headers if available
                  const sortAndNormalizeAttributes = unordered => {
                    const _ = {};
                    Object.keys(unordered)
                      .sort(Intl.Collator().compare)
                      .forEach(function(key) {
                        _[key.toLowerCase()] = unordered[key];
                      });
                    return _;
                  };
                  const headerObjectsAreEqual = (a, b) => {
                    const nA = JSON.stringify(sortAndNormalizeAttributes(a));
                    const nB = JSON.stringify(sortAndNormalizeAttributes(b));
                    return nA === nB;
                  };
                  const responseHeaders = onCompletedEventDetails.responseHeaders.reduce(
                    (
                      _: any,
                      responseHeader: WebRequest.HttpHeadersItemType,
                    ) => {
                      _[responseHeader.name] = responseHeader.value
                        ? responseHeader.value
                        : responseHeader.binaryValue;
                      return _;
                    },
                    {},
                  );
                  const candidateResponseHeaders =
                    candidateResponseInfo.response.headers;
                  if (
                    !headerObjectsAreEqual(
                      responseHeaders,
                      candidateResponseHeaders,
                    )
                  ) {
                    return;
                  }

                  break;
                default:
                  throw new Error(
                    `Response body listener was active for an unsupported request resource type: ${onCompletedEventDetails.type}`,
                  );
              }

              // Resolve the promises
              // console.debug(`${logMsgPrefix}Resolving promises`);
              const enc = new TextEncoder();
              const buffer =
                typeof candidateResponseInfo.response.data === "string"
                  ? enc.encode(candidateResponseInfo.response.data).buffer
                  : candidateResponseInfo.response.data;
              const firstPartOfBuffer = buffer.slice(0, 1024 * 10); // first 10kb
              sha256Buffer(firstPartOfBuffer).then(digest => {
                this.resolveContentHash(digest);
              });
              const responseBody = new Uint8Array(buffer);
              this.resolveResponseBody(responseBody);

              // Remove this particular listener
              // console.debug(`${logMsgPrefix}Removing listener`);
              browser.runtime.onMessage.removeListener(
                this.responseBodyPageScriptMessageListener,
              );
            } catch (error) {
              const logMsg = `${logMsgPrefix}Error occurred when trying to match response info from injected page script messages: ${error.message}\n${error.stack}`;
              console.error(logMsg, error);
              dataReceiver.logError(logMsg);
            }
          }
        };
        browser.runtime.onMessage.addListener(
          this.responseBodyPageScriptMessageListener,
        );
        // TODO: stop listening after X seconds
      }
    }
  }

  public async getResponseBody() {
    return this.responseBody;
  }

  public async getContentHash() {
    return this.contentHash;
  }
}

import { browser } from "webextension-polyfill-ts";
import {
  OpenWPMInjectedPageScriptResponseInfo,
  responseBodyListenerPageScript,
} from "./response-body-listener-page-scope";

export interface OpenWPMResponseInfoSentFromContentScript {
  namespace: "response-body-listener";
  timeStamp: string;
  responseInfo: OpenWPMInjectedPageScriptResponseInfo;
}

function getPageScriptAsString() {
  return `(${responseBodyListenerPageScript}());`;
}

function insertScript(text, data) {
  const parent = document.documentElement,
    script = document.createElement("script");
  script.text = text;
  script.async = false;

  for (const key of Object.keys(data)) {
    const qualifiedName = "data-" + key.split("_").join("-");
    script.setAttribute(qualifiedName, data[key]);
  }

  parent.insertBefore(script, parent.firstChild);
  parent.removeChild(script);
}

function emitMsg(responseInfo: OpenWPMInjectedPageScriptResponseInfo) {
  const timeStamp = new Date().toISOString();
  const message: OpenWPMResponseInfoSentFromContentScript = {
    namespace: "response-body-listener",
    timeStamp,
    responseInfo,
  };
  browser.runtime.sendMessage(message);
}

export function injectResponseBodyListenerPageScript(contentScriptConfig) {
  const injection_uuid = Math.random();

  // listen for messages from the script we are about to insert
  document.addEventListener(injection_uuid.toString(), function(
    e: CustomEvent,
  ) {
    if (!e.detail) {
      console.error("Message sent from page script was empty/falsy", { e });
      throw new Error("Message sent from page script was empty/falsy");
    }
    // pass these on to the background page
    const msgs = e.detail;
    if (Array.isArray(msgs)) {
      msgs.forEach(function(responseInfo) {
        emitMsg(responseInfo);
      });
    } else {
      emitMsg(msgs);
    }
  });

  insertScript(getPageScriptAsString(), {
    injection_uuid,
    ...contentScriptConfig,
  });
}

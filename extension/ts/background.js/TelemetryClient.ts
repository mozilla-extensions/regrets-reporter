// /submit/<namespace>/<docType>/<docVersion>/<docId>
// https://docs.telemetry.mozilla.org/concepts/pipeline/http_edge_spec.html

import { config } from "../config";
import nock from "nock";
import { AnnotatedSharedData } from "./DataSharer";

declare namespace browser.telemetry {
  function submitPing(
    type: string,
    message: any,
    options: {
      addClientId: boolean;
      addEnvironment: boolean;
    },
  ): void;
}

const MS_IN_A_MINUTE = 60 * 1000;

// Timeout after which we consider a ping submission failed.
const PING_SUBMIT_TIMEOUT_MS = 1.5 * MS_IN_A_MINUTE;

// https://stackoverflow.com/a/57888548/682317
const fetchWithTimeout = (url, ms, options: any = {}) => {
  const controller = new AbortController();
  const promise = fetch(url, { signal: controller.signal, ...options });
  const timeout = setTimeout(() => controller.abort(), ms);
  return promise.finally(() => clearTimeout(timeout));
};

export class TelemetryClient {
  composeSubmitRequestPath = (namespace, docType, docVersion, docId) => {
    return `/submit/${namespace}/${docType}/${docVersion}/${docId}`;
  };

  composeSubmitUrl = (namespace, docType, docVersion, docId) => {
    return `${config.telemetryServer}${this.composeSubmitRequestPath(
      namespace,
      docType,
      docVersion,
      docId,
    )}`;
  };

  // TODO
  validatePayload = () => {};

  submitPayload = async (payload: AnnotatedSharedData) => {
    const namespace = "regrets-reporter";
    const docType = "regrets-reporter-update";
    const docVersion = 1;
    const docId = payload.event_metadata.event_uuid;

    const dataResponse = await fetchWithTimeout(
      this.composeSubmitUrl(namespace, docType, docVersion, docId),
      PING_SUBMIT_TIMEOUT_MS,
      {
        method: "POST",
        headers: {
          Accept: "text/plain",
          "Content-Type": "application/json; charset=UTF-8",
          Date: new Date().toUTCString(),
        },
        body: JSON.stringify(payload),
      },
    ).catch(async error => {
      if (error.name === "AbortError") {
        // fetch aborted due to timeout
      } else {
        // network error or json parsing error
      }
      console.error(
        "Error encountered when submitting a telemetry payload. Returning an empty result",
      );
      console.error({ error });
      return false;
    });

    console.log({ dataResponse });
    if (dataResponse === true) {
      return true;
    }
    console.error("Fetched data response is not truthy");
  };
}

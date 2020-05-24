import { config } from "../config";
import { AnnotatedSharedData } from "./DataSharer";
import { validateSchema } from "./lib/validateSchema";
import * as pako from "pako";

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
const fetchWithTimeout = (url, ms, options: any = {}): Promise<Response> => {
  const controller = new AbortController();
  const promise = fetch(url, { signal: controller.signal, ...options });
  const timeout = setTimeout(() => controller.abort(), ms);
  return promise.finally(() => clearTimeout(timeout));
};

export class TelemetryClient {
  /**
   * See https://docs.telemetry.mozilla.org/concepts/pipeline/http_edge_spec.html
   *
   * @param namespace
   * @param docType
   * @param docVersion
   * @param docId
   */
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

  validatePayload = (payload: AnnotatedSharedData) => {
    console.debug(
      "Telemetry about to be validated using the compiled ajv validate() function:",
      payload,
    );

    const validationResult = validateSchema(payload);

    if (!validationResult.valid) {
      console.error("Invalid telemetry payload", { payload, validationResult });
      throw new Error("Invalid telemetry payload");
    }
  };

  submitPayload = async (payload: AnnotatedSharedData) => {
    this.validatePayload(payload);

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
          "Content-Encoding": "gzip",
        },
        body: await pako.gzip(JSON.stringify(payload)),
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
    if (dataResponse === false) {
      return false;
    }
    if (dataResponse === true) {
      return true;
    }
    const response = await dataResponse.text();
    console.log({ response });
    return response;
  };
}

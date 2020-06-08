import { config } from "../config";
import { AnnotatedSharedData } from "./DataSharer";
import { validateSchema } from "./lib/validateSchema";
import { gzip } from "pako";
import { captureExceptionWithExtras } from "../shared-resources/ErrorReporting";

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

// https://stackoverflow.com/a/57888548/682317
const fetchWithTimeout = (url, ms, options: any = {}): Promise<Response> => {
  const controller = new AbortController();
  const promise = fetch(url, { signal: controller.signal, ...options });
  const timeout = setTimeout(() => controller.abort(), ms);
  return promise.finally(() => clearTimeout(timeout));
};

export class TelemetryClient {
  /**
   * Timeout after which we consider a ping submission failed.
   */
  private pingSubmitTimeoutMs: number = 1.5 * MS_IN_A_MINUTE;
  constructor(pingSubmitTimeoutMs: number = null) {
    if (pingSubmitTimeoutMs) {
      this.pingSubmitTimeoutMs = pingSubmitTimeoutMs;
    }
  }

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

  /**
   * Validate the payload using the compiled ajv validate() function
   * @param payload
   */
  validatePayload = (payload: AnnotatedSharedData) => {
    const validationResult = validateSchema(payload);

    if (!validationResult.valid) {
      const exception = new Error("Invalid telemetry payload");
      captureExceptionWithExtras(exception, { validationResult });
      console.error("Invalid telemetry payload", {
        payload,
        validationResult,
      });
      return false;
    }
    return true;
  };

  submitPayload = async (
    payload: AnnotatedSharedData,
  ): Promise<string | false> => {
    console.debug("Telemetry about to be validated and sent:", payload);
    if (!this.validatePayload(payload)) {
      return false;
    }
    const onError = error => {
      if (error.name === "AbortError") {
        // fetch aborted due to timeout
      } else {
        // network error or other error
      }

      captureExceptionWithExtras(error, {
        msg:
          "Error encountered when submitting a telemetry payload. Returning an empty result",
      });
      console.error(
        "Error encountered when submitting a telemetry payload. Returning an empty result",
      );
      console.error({ error });
    };

    let result;
    try {
      result = await this.uploadPayload(payload).catch(onError);
    } catch (err) {
      onError(err);
      return false;
    }
    console.debug("Telemetry submitted");
    return result;
  };

  uploadPayload = async (payload: AnnotatedSharedData): Promise<string> => {
    const namespace = "regrets-reporter";
    const docType = "regrets-reporter-update";
    const docVersion = 1;
    const docId = payload.event_metadata.event_uuid;

    const dataResponse = await fetchWithTimeout(
      this.composeSubmitUrl(namespace, docType, docVersion, docId),
      this.pingSubmitTimeoutMs,
      {
        method: "POST",
        headers: {
          Accept: "text/plain",
          "Content-Type": "application/json; charset=UTF-8",
          Date: new Date().toUTCString(),
          "Content-Encoding": "gzip",
          "X-Client-Type": "RegretsReporter",
          "X-Client-Version": globalThis.browser.runtime.getManifest().version,
        },
        body: await gzip(JSON.stringify(payload)),
      },
    ).catch(async error => {
      return Promise.reject(error);
    });

    if (!dataResponse.ok) {
      throw new Error("Data response failed");
    }
    return await dataResponse.text();
  };
}

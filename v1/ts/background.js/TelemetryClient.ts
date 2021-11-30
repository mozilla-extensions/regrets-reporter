import { config } from "../config";
import { AnnotatedSharedData } from "./DataSharer";
import { validateSchema } from "./lib/validateSchema";
import { gzip } from "pako";
import { captureExceptionWithExtras } from "../shared-resources/ErrorReporting";
import { Store } from "./Store";
import { browser } from "webextension-polyfill-ts";

const MS_IN_A_MINUTE = 60 * 1000;

// https://stackoverflow.com/a/57888548/682317
const fetchWithTimeout = (url, ms, options: any = {}): Promise<Response> => {
  const controller = new AbortController();
  const promise = fetch(url, { signal: controller.signal, ...options });
  const timeout = setTimeout(() => controller.abort(), ms);
  return promise.finally(() => clearTimeout(timeout));
};

type UploadResult = string | false;

export class TelemetryClient {
  private store: Store;

  /**
   * Timeout after which we consider a ping submission failed.
   */
  private pingSubmitTimeoutMs: number = 1.5 * MS_IN_A_MINUTE;
  constructor(store: Store, pingSubmitTimeoutMs: number = null) {
    this.store = store;
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
  private composeSubmitRequestPath = (
    namespace,
    docType,
    docVersion,
    docId,
  ) => {
    return `/submit/${namespace}/${docType}/${docVersion}/${docId}`;
  };

  private composeSubmitUrl = (namespace, docType, docVersion, docId) => {
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
  public validatePayload = (payload: AnnotatedSharedData) => {
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

  public submitPayload = async (
    payload: AnnotatedSharedData,
  ): Promise<UploadResult> => {
    console.debug(
      "Telemetry about to be validated and queued for upload (if valid):",
      payload,
    );
    if (!this.validatePayload(payload)) {
      return false;
    }
    await this.queueUpload(payload);
  };

  private queueUpload = async (payload: AnnotatedSharedData): Promise<void> => {
    const queuedUploads = await this.getQueuedUploads();
    queuedUploads.push(payload);
    await this.store.set({ queuedUploads });
    console.debug("Telemetry payload queued for upload");
  };

  private removeUploadFromQueue = async (
    payload: AnnotatedSharedData,
  ): Promise<void> => {
    const queuedUploads = await this.getQueuedUploads();
    const filteredQueuedUploads = queuedUploads.filter(
      ($payload: AnnotatedSharedData) =>
        $payload.event_metadata.event_uuid !==
        payload.event_metadata.event_uuid,
    );
    await this.store.set({ queuedUploads: filteredQueuedUploads });
  };

  private uploadPayload = async (
    payload: AnnotatedSharedData,
  ): Promise<UploadResult> => {
    let result: UploadResult;
    const onError = (error): false => {
      if (error.name === "AbortError") {
        // fetch aborted due to timeout
        this.queueUpload(payload);
      } else if (
        error.name === "TypeError" &&
        (error.message.indexOf(
          "NetworkError when attempting to fetch resource",
        ) === 0 ||
          error.message.indexOf("Failed to fetch") === 0)
      ) {
        // network error
        console.info(
          "Telemetry upload attempt failed temporarily - re-adding to upload queue for a future delivery attempt",
        );
        this.queueUpload(payload);
      } else if (error.name === "FetchError") {
        // some other request error
        console.info(
          "Telemetry upload attempt failed temporarily - re-adding to upload queue for a future delivery attempt",
        );
        this.queueUpload(payload);
      } else {
        // other error (note: not storing the payload for retry)
        captureExceptionWithExtras(error, {
          comment: "Unexpected encountered when submitting a telemetry payload",
          errorName: error.name,
          errorMessage: error.message,
        });
        console.error(
          "Unexpected encountered when submitting a telemetry payload",
          { error },
        );
      }
      return false;
    };
    try {
      // Upload
      result = await this.sendUploadPayloadRequest(payload).catch(onError);
      if (result !== false) {
        console.debug("Telemetry payload uploaded");
      }
    } catch (err) {
      result = onError(err);
    }
    return result;
  };

  private sendUploadPayloadRequest = async (
    payload: AnnotatedSharedData,
  ): Promise<string> => {
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
          "X-Client-Version": browser.runtime.getManifest().version,
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

  public getQueuedUploads = async (): Promise<AnnotatedSharedData[]> => {
    const { queuedUploads } = await this.store.get("queuedUploads");
    return queuedUploads || [];
  };

  sendQueuedUploads = async (): Promise<UploadResult[]> => {
    const queuedUploads = await this.getQueuedUploads();
    const uploadResults: UploadResult[] = [];
    for (const queuedUpload of queuedUploads) {
      await this.removeUploadFromQueue(queuedUpload);
      uploadResults.push(await this.uploadPayload(queuedUpload));
    }
    return uploadResults;
  };

  private sendQueuedUploadsAlarmName: string;

  public async run() {
    await this.sendQueuedUploadsPeriodically();
  }

  public async sendQueuedUploadsPeriodically() {
    this.sendQueuedUploadsAlarmName = `${browser.runtime.id}:telemetryClientSendQueuedUploadsAlarm`;
    const action = async () => {
      console.info(`Uploading queued telemetry payloads`);
      await this.sendQueuedUploads();
    };
    const alarmListener = async _alarm => {
      if (_alarm.name !== this.sendQueuedUploadsAlarmName) {
        return false;
      }
      await action();
    };
    browser.alarms.onAlarm.addListener(alarmListener);
    browser.alarms.create(this.sendQueuedUploadsAlarmName, {
      periodInMinutes: 60, // every hour
    });
    // Also execute immediately
    await action();
  }

  public async cleanup() {
    if (this.sendQueuedUploadsAlarmName) {
      await browser.alarms.clear(this.sendQueuedUploadsAlarmName);
    }
  }
}

// /submit/<namespace>/<docType>/<docVersion>/<docId>
// https://docs.telemetry.mozilla.org/concepts/pipeline/http_edge_spec.html

import { config } from "../config";
import nock from "nock";

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

  submitPayload = async (telemetryTopic, payload) => {
    const namespace = "regrets-reporter";
    const docType = telemetryTopic;
    const docVersion = 1;
    const docId = "foo";

    const dataResponse = await fetch(
      this.composeSubmitUrl(namespace, docType, docVersion, docId),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /*
          Date - The client-supplied timestamp of the incoming request. Used for computing client clock skew.
           */
        },
        body: JSON.stringify(payload),
      },
    ).catch(async error => {
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

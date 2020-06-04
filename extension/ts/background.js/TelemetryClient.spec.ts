import { assert } from "chai";
import nock from "nock";
import { config } from "../config";
import { TelemetryClient } from "./TelemetryClient";
import { AnnotatedSharedData, DataSharer } from "./DataSharer";
import { Store } from "./Store";
import { mockLocalStorage } from "./lib/mockLocalStorage";

describe("TelemetryClient", function() {
  const telemetryClient = new TelemetryClient();

  it("successful submitPayload request results in a sent request, flushed from the send queue", async function() {
    nock.disableNetConnect();
    nock(config.telemetryServer)
      .post(/\/submit\/regrets-reporter\/regrets-reporter-update\/1\/.*/)
      .query(true)
      .reply(
        200,
        (uri, requestBody) => {
          return "OK";
        },
        {
          "accept-encoding": "gzip, deflate",
          "content-type": "text/plain",
        },
      );

    const store = new Store(mockLocalStorage);
    const dataSharer = new DataSharer(store);
    const annotatedData: AnnotatedSharedData = await dataSharer.annotateSharedData(
      {},
      0,
    );

    const submitPayloadReturnValue = await telemetryClient.submitPayload(
      annotatedData,
    );
    console.log({ submitPayloadReturnValue });

    assert.equal(submitPayloadReturnValue, "OK");
  });

  /* TODO
  it("unsuccessful submitPayload request results in an unsent request in the queue", async function() {
    nock.disableNetConnect();
    nock(config.telemetryServer)
      .post(/\/submit\/regrets-reporter\/regrets-reporter-update\/1\/.* /)
      .query(true)
      .reply(
        200,
        (uri, requestBody) => {
          return "OK";
        },
        {
          "accept-encoding": "gzip, deflate",
          "content-type": "text/plain",
        },
      );

    const store = new Store(mockLocalStorage);
    const dataSharer = new DataSharer(store);
    const annotatedData: AnnotatedSharedData = await dataSharer.annotateSharedData(
      {},
      0,
    );

    const submitPayloadReturnValue = await telemetryClient.submitPayload(
      annotatedData,
    );
    console.log({ submitPayloadReturnValue });

    assert.equal(submitPayloadReturnValue, "OK");
  });
  */
});

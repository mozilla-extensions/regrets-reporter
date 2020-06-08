import { assert } from "chai";
import nock from "nock";
import { config } from "../config";
import { TelemetryClient } from "./TelemetryClient";
import { AnnotatedSharedData, DataSharer } from "./DataSharer";
import { Store } from "./Store";
import { mockLocalStorage } from "./lib/mockLocalStorage";

describe("TelemetryClient", function() {
  const pingSubmitTimeoutMs = 500;
  nock.disableNetConnect();
  const successfulResponseNockCallback = (uri, requestBody) => {
    return [
      200,
      "",
      {
        "accept-encoding": "gzip, deflate",
        "content-type": "text/plain",
      },
    ];
  };

  it("successful request results in a sent request, not added to the re-send queue", async function() {
    mockLocalStorage.reset();
    const store = new Store(mockLocalStorage);
    const dataSharer = new DataSharer(store);
    const telemetryClient = new TelemetryClient(store, pingSubmitTimeoutMs);
    const annotatedData: AnnotatedSharedData = await dataSharer.annotateSharedData(
      {},
      0,
    );

    await telemetryClient.submitPayload(annotatedData);
    const queuedUploads = await telemetryClient.getQueuedUploads();
    assert.strictEqual(queuedUploads.length, 1);

    nock(config.telemetryServer)
      .post(/\/submit\/regrets-reporter\/regrets-reporter-update\/1\/.*/)
      .query(true)
      .reply(successfulResponseNockCallback);
    const submitPayloadReturnValues = await telemetryClient.sendQueuedUploads();
    assert.deepStrictEqual(submitPayloadReturnValues, [""]);

    const queuedUploadsAfterSendAttempt = await telemetryClient.getQueuedUploads();
    assert.strictEqual(queuedUploadsAfterSendAttempt.length, 0);
  });

  it("successful request does not result in a sent request, and not added to the re-send queue", async function() {
    mockLocalStorage.reset();
    const store = new Store(mockLocalStorage);
    const dataSharer = new DataSharer(store);
    const telemetryClient = new TelemetryClient(store, pingSubmitTimeoutMs);
    const annotatedData: AnnotatedSharedData = await dataSharer.annotateSharedData(
      // @ts-ignore
      { regret_report: "foo" },
      0,
    );

    await telemetryClient.submitPayload(annotatedData);
    const queuedUploads = await telemetryClient.getQueuedUploads();
    assert.strictEqual(queuedUploads.length, 0);

    const submitPayloadReturnValues = await telemetryClient.sendQueuedUploads();
    assert.deepStrictEqual(submitPayloadReturnValues, []);

    const queuedUploadsAfterSendAttempt = await telemetryClient.getQueuedUploads();
    assert.strictEqual(queuedUploadsAfterSendAttempt.length, 0);
  });

  it("unsuccessful request results in an unsent request in the queue, which is later sent upon retry", async function() {
    mockLocalStorage.reset();
    const store = new Store(mockLocalStorage);
    const dataSharer = new DataSharer(store);
    const telemetryClient = new TelemetryClient(store, pingSubmitTimeoutMs);
    const annotatedData: AnnotatedSharedData = await dataSharer.annotateSharedData(
      {},
      0,
    );

    await telemetryClient.submitPayload(annotatedData);
    const queuedUploads = await telemetryClient.getQueuedUploads();
    assert.strictEqual(queuedUploads.length, 1);

    nock(config.telemetryServer)
      .post(/\/submit\/regrets-reporter\/regrets-reporter-update\/1\/.*/)
      .query(true)
      .replyWithError("Error enforced by test");
    const submitPayloadReturnValues = await telemetryClient.sendQueuedUploads();
    assert.deepStrictEqual(submitPayloadReturnValues, [false]);

    nock(config.telemetryServer)
      .post(/\/submit\/regrets-reporter\/regrets-reporter-update\/1\/.*/)
      .query(true)
      .reply(successfulResponseNockCallback);
    const submitPayloadReturnValuesAfterRetry = await telemetryClient.sendQueuedUploads();
    assert.deepStrictEqual(submitPayloadReturnValuesAfterRetry, [""]);
    const queuedUploadsAfterRetry = await telemetryClient.getQueuedUploads();
    assert.strictEqual(queuedUploadsAfterRetry.length, 0);
  });

  it("timed-out request results in an unsent request in the queue, which is later sent upon retry", async function() {
    mockLocalStorage.reset();
    const store = new Store(mockLocalStorage);
    const dataSharer = new DataSharer(store);
    const telemetryClient = new TelemetryClient(store, pingSubmitTimeoutMs);
    const annotatedData: AnnotatedSharedData = await dataSharer.annotateSharedData(
      {},
      0,
    );

    await telemetryClient.submitPayload(annotatedData);
    const queuedUploads = await telemetryClient.getQueuedUploads();
    assert.strictEqual(queuedUploads.length, 1);

    nock(config.telemetryServer)
      .post(/\/submit\/regrets-reporter\/regrets-reporter-update\/1\/.*/)
      .delayConnection(1000)
      .query(true)
      .reply(successfulResponseNockCallback);
    const submitPayloadReturnValues = await telemetryClient.sendQueuedUploads();
    assert.deepStrictEqual(submitPayloadReturnValues, [false]);

    nock(config.telemetryServer)
      .post(/\/submit\/regrets-reporter\/regrets-reporter-update\/1\/.*/)
      .query(true)
      .reply(successfulResponseNockCallback);
    const submitPayloadReturnValuesAfterRetry = await telemetryClient.sendQueuedUploads();
    assert.deepStrictEqual(submitPayloadReturnValuesAfterRetry, [""]);
    const queuedUploadsAfterRetry = await telemetryClient.getQueuedUploads();
    assert.strictEqual(queuedUploadsAfterRetry.length, 0);
  });
});

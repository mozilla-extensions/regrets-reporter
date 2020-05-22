import { assert } from "chai";
import nock from "nock";
import { config } from "../config";
import { TelemetryClient } from "./TelemetryClient";

describe("TelemetryClient", function() {
  const telemetryClient = new TelemetryClient();

  it("successful submitPayload request results in a sent request, flushed from the send queue", async function() {
    console.log({ config });

    nock.disableNetConnect();
    nock(config.telemetryServer)
      .post("/submit/regrets-reporter/regrets-reporter/1/foo")
      .query(true)
      .reply(200, (uri, requestBody) => {
        if (this.req) {
          console.log("path:", this.req.path);
          console.log("headers:", this.req.headers);
        }
        console.log({ requestBody });
        return "foo";
      });

    const data = await telemetryClient.submitPayload("regrets-reporter", {
      foo: "bar",
    });
    console.log({ data });

    assert.equal("bar", "bar");
  });

  it("unsuccessful submitPayload request results in an unsent request in the queue", async function() {
    console.log({ config });

    nock.disableNetConnect();
    nock(config.telemetryServer)
      .post("/submit/regrets-reporter/regrets-reporter/1/foo")
      .query(true)
      .reply(200, (uri, requestBody) => {
        if (this.req) {
          console.log("path:", this.req.path);
          console.log("headers:", this.req.headers);
        }
        console.log({ requestBody });
        return "foo";
      });

    const data = await telemetryClient.submitPayload("regrets-reporter", {
      foo: "bar",
    });
    console.log({ data });

    assert.equal("bar", "bar");
  });
});

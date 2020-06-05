import { assert } from "chai";
import {
  NavigationBatch,
  OpenWpmPayloadEnvelope,
  NavigationBatchPreprocessor,
} from "./NavigationBatchPreprocessor";
import { parseIsoDateTimeString } from "./lib/dateUtils";
import { addSeconds } from "date-fns";
import { openwpmTestPagesCanvasFingerprintingQueue } from "./fixtures/NavigationBatchPreprocessor/openwpmTestPagesCanvasFingerprintingQueue";
import { exampleDotComVisitQueue } from "./fixtures/NavigationBatchPreprocessor/exampleDotComVisitQueue";
import { exampleDotComVisitFollowedByMoreInformationLinkClickQueue } from "./fixtures/NavigationBatchPreprocessor/exampleDotComVisitFollowedByMoreInformationLinkClickQueue";
import { exampleDotComVisitQueueWithSavedContent } from "./fixtures/NavigationBatchPreprocessor/exampleDotComVisitQueueWithSavedContent";
import { youtubeReloadWatchPageHttpRequestAndResponseSplitOrdinallyAcrossTwoNavigations } from "./fixtures/NavigationBatchPreprocessor/youtubeReloadWatchPageHttpRequestAndResponseSplitOrdinallyAcrossTwoNavigations";

describe("NavigationBatchPreprocessor", function() {
  it("should exist", function() {
    const navigationBatchPreprocessor = new NavigationBatchPreprocessor();
    assert.isNotEmpty(navigationBatchPreprocessor);
  });

  describe("Example.com visit", function() {
    const navigationBatchPreprocessor = new NavigationBatchPreprocessor();
    exampleDotComVisitQueue.map(
      (openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) => {
        if (
          navigationBatchPreprocessor.shouldBeBatched(openWpmPayloadEnvelope)
        ) {
          navigationBatchPreprocessor.queueForProcessing(
            openWpmPayloadEnvelope,
          );
        }
      },
    );

    const firstVisitIsoDateTimeString = "2018-11-23T01:34:40.475Z";
    const firstVisitDateTime = parseIsoDateTimeString(
      firstVisitIsoDateTimeString,
    );

    describe("Queue processing 20 seconds after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 20);
      it("should have found one navigation batch", async function() {
        navigationBatchPreprocessor.navigationBatchesByNavigationUuid = {};
        await navigationBatchPreprocessor.processQueue(nowDateTime);
        assert.equal(
          navigationBatchPreprocessor.openWpmPayloadEnvelopeProcessQueue.length,
          1,
        );
        const navigationUuids = Object.keys(
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid,
        );
        assert.equal(navigationUuids.length, 1);
        const firstNavigationBatch: NavigationBatch =
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid[
            navigationUuids[0]
          ];
        assert.equal(firstNavigationBatch.childEnvelopes.length, 4);
        assert.equal(firstNavigationBatch.httpRequestCount, 2);
        assert.equal(firstNavigationBatch.httpResponseCount, 2);
        assert.equal(firstNavigationBatch.httpRedirectCount, 0);
        assert.equal(firstNavigationBatch.javascriptOperationCount, 0);
        assert.equal(firstNavigationBatch.capturedContentCount, 0);
      });
    });

    describe("Queue processing 10 hours after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 10 * 60 * 60);
      it("should have purged all navigation batches", async function() {
        navigationBatchPreprocessor.navigationBatchesByNavigationUuid = {};
        await navigationBatchPreprocessor.processQueue(nowDateTime);
        assert.equal(
          navigationBatchPreprocessor.openWpmPayloadEnvelopeProcessQueue.length,
          0,
        );
        const navigationUuids = Object.keys(
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid,
        );
        assert.equal(navigationUuids.length, 0);
      });
    });
  });

  describe("Example.com visit with saved content", function() {
    const navigationBatchPreprocessor = new NavigationBatchPreprocessor();
    exampleDotComVisitQueueWithSavedContent.map(
      (openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) => {
        if (
          navigationBatchPreprocessor.shouldBeBatched(openWpmPayloadEnvelope)
        ) {
          navigationBatchPreprocessor.queueForProcessing(
            openWpmPayloadEnvelope,
          );
        }
      },
    );

    const firstVisitIsoDateTimeString = "2020-03-31T09:34:32.685Z";
    const firstVisitDateTime = parseIsoDateTimeString(
      firstVisitIsoDateTimeString,
    );

    describe("Queue processing 20 seconds after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 20);
      it("should have found one navigation batch", async function() {
        navigationBatchPreprocessor.navigationBatchesByNavigationUuid = {};
        await navigationBatchPreprocessor.processQueue(nowDateTime);
        assert.equal(
          navigationBatchPreprocessor.openWpmPayloadEnvelopeProcessQueue.length,
          1,
        );
        const navigationUuids = Object.keys(
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid,
        );
        assert.equal(navigationUuids.length, 1);
        const firstNavigationBatch: NavigationBatch =
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid[
            navigationUuids[0]
          ];
        assert.equal(firstNavigationBatch.childEnvelopes.length, 6);
        assert.equal(firstNavigationBatch.httpRequestCount, 2);
        assert.equal(firstNavigationBatch.httpResponseCount, 2);
        assert.equal(firstNavigationBatch.httpRedirectCount, 0);
        assert.equal(firstNavigationBatch.javascriptOperationCount, 0);
        assert.equal(firstNavigationBatch.capturedContentCount, 2);
      });
    });

    describe("Queue processing 10 hours after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 10 * 60 * 60);
      it("should have purged all navigation batches", async function() {
        navigationBatchPreprocessor.navigationBatchesByNavigationUuid = {};
        await navigationBatchPreprocessor.processQueue(nowDateTime);
        assert.equal(
          navigationBatchPreprocessor.openWpmPayloadEnvelopeProcessQueue.length,
          0,
        );
        const navigationUuids = Object.keys(
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid,
        );
        assert.equal(navigationUuids.length, 0);
      });
    });
  });

  describe("Example.com visit followed by 'More information' link click", function() {
    const navigationBatchPreprocessor = new NavigationBatchPreprocessor();
    exampleDotComVisitFollowedByMoreInformationLinkClickQueue.map(
      (openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) => {
        if (
          navigationBatchPreprocessor.shouldBeBatched(openWpmPayloadEnvelope)
        ) {
          navigationBatchPreprocessor.queueForProcessing(
            openWpmPayloadEnvelope,
          );
        }
      },
    );

    const firstVisitIsoDateTimeString = "2018-11-23T01:34:40.475Z";
    // const secondVisitIsoDateTimeString = "2018-11-23T01:34:45.488Z";
    const firstVisitDateTime = parseIsoDateTimeString(
      firstVisitIsoDateTimeString,
    );
    /*
    const secondVisitDateTime = parseIsoDateTimeString(
      secondVisitIsoDateTimeString,
    );
    */

    describe("Subsequent queue processing 12 seconds after the visit (around 7 seconds after the second visit)", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 12);
      it("should have found two navigation batches", async function() {
        navigationBatchPreprocessor.navigationBatchesByNavigationUuid = {};
        await navigationBatchPreprocessor.processQueue(nowDateTime);
        assert.equal(
          navigationBatchPreprocessor.openWpmPayloadEnvelopeProcessQueue.length,
          2,
        );
        const navigationUuids = Object.keys(
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid,
        );
        assert.equal(navigationUuids.length, 2);
        const oneNavigationBatch: NavigationBatch =
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid[
            "290cb5b2-828c-4eec-9626-69463b7b4d05"
          ];
        assert.equal(oneNavigationBatch.childEnvelopes.length, 4);
        assert.deepStrictEqual(
          [
            oneNavigationBatch.httpRequestCount,
            oneNavigationBatch.httpResponseCount,
            oneNavigationBatch.httpRedirectCount,
            oneNavigationBatch.javascriptOperationCount,
          ],
          [2, 2, 0, 0],
        );

        const anotherNavigationBatch: NavigationBatch =
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid[
            "bd1e0e8e-6c72-4a93-983b-d59c336b4472"
          ];
        assert.equal(anotherNavigationBatch.childEnvelopes.length, 22);
        assert.deepStrictEqual(
          [
            anotherNavigationBatch.httpRequestCount,
            anotherNavigationBatch.httpResponseCount,
            anotherNavigationBatch.httpRedirectCount,
            anotherNavigationBatch.javascriptOperationCount,
          ],
          [11, 10, 1, 0],
        );
      });
    });

    describe("Subsequent queue processing 10 hours after after the visits", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 10 * 60 * 60);
      it("should have purged all navigation batches", async function() {
        navigationBatchPreprocessor.navigationBatchesByNavigationUuid = {};
        await navigationBatchPreprocessor.processQueue(nowDateTime);
        assert.equal(
          navigationBatchPreprocessor.openWpmPayloadEnvelopeProcessQueue.length,
          0,
        );
        const navigationUuids = Object.keys(
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid,
        );
        assert.equal(navigationUuids.length, 0);
      });
    });
  });

  describe("OpenWPM http://localtest.me:8000/test_pages/canvas_fingerprinting.html", function() {
    const navigationBatchPreprocessor = new NavigationBatchPreprocessor();
    openwpmTestPagesCanvasFingerprintingQueue.map(
      (openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) => {
        if (
          navigationBatchPreprocessor.shouldBeBatched(openWpmPayloadEnvelope)
        ) {
          navigationBatchPreprocessor.queueForProcessing(
            openWpmPayloadEnvelope,
          );
        }
      },
    );

    const firstVisitIsoDateTimeString = "2018-11-26T14:11:51.759Z";
    const firstVisitDateTime = parseIsoDateTimeString(
      firstVisitIsoDateTimeString,
    );

    describe("Queue processing 20 seconds after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 20);
      it("should have found two navigation batches", async function() {
        navigationBatchPreprocessor.navigationBatchesByNavigationUuid = {};
        await navigationBatchPreprocessor.processQueue(nowDateTime);
        assert.equal(
          navigationBatchPreprocessor.openWpmPayloadEnvelopeProcessQueue.length,
          1,
        );
        const navigationUuids = Object.keys(
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid,
        );
        assert.equal(navigationUuids.length, 1);
        const firstNavigationBatch: NavigationBatch =
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid[
            navigationUuids[0]
          ];
        assert.equal(firstNavigationBatch.childEnvelopes.length, 15);
        const {
          httpRequestCount,
          httpResponseCount,
          httpRedirectCount,
          javascriptOperationCount,
        } = firstNavigationBatch;
        assert.deepStrictEqual(
          [
            httpRequestCount,
            httpResponseCount,
            httpRedirectCount,
            javascriptOperationCount,
          ],
          [2, 2, 0, 11],
        );
      });
    });

    describe("Queue processing 10 hours after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 10 * 60 * 60);
      it("should have purged all navigation batches", async function() {
        navigationBatchPreprocessor.navigationBatchesByNavigationUuid = {};
        await navigationBatchPreprocessor.processQueue(nowDateTime);
        assert.equal(
          navigationBatchPreprocessor.openWpmPayloadEnvelopeProcessQueue.length,
          0,
        );
        const navigationUuids = Object.keys(
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid,
        );
        assert.equal(navigationUuids.length, 0);
      });
    });
  });

  describe("Process large navigation batch from modified OpenWPM http://localtest.me:8000/test_pages/canvas_fingerprinting.html queue", function() {
    // Inject two large values
    const largeOpenwpmTestPagesCanvasFingerprintingQueue = JSON.parse(
      JSON.stringify(openwpmTestPagesCanvasFingerprintingQueue),
    );
    const str300kb = "01234567890".repeat(100 * 300);
    largeOpenwpmTestPagesCanvasFingerprintingQueue[3].javascriptOperation.value = str300kb;
    largeOpenwpmTestPagesCanvasFingerprintingQueue[10].javascriptOperation.value = str300kb;

    const navigationBatchPreprocessor = new NavigationBatchPreprocessor();
    largeOpenwpmTestPagesCanvasFingerprintingQueue.map(
      (openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) => {
        if (
          navigationBatchPreprocessor.shouldBeBatched(openWpmPayloadEnvelope)
        ) {
          navigationBatchPreprocessor.queueForProcessing(
            openWpmPayloadEnvelope,
          );
        }
      },
    );

    const firstVisitIsoDateTimeString = "2018-11-26T14:11:51.759Z";
    const firstVisitDateTime = parseIsoDateTimeString(
      firstVisitIsoDateTimeString,
    );

    describe("Queue processing 20 seconds after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 20);
      it("should have found two navigation batches", async function() {
        navigationBatchPreprocessor.navigationBatchesByNavigationUuid = {};
        await navigationBatchPreprocessor.processQueue(nowDateTime);
        assert.equal(
          navigationBatchPreprocessor.openWpmPayloadEnvelopeProcessQueue.length,
          1,
        );
        const navigationUuids = Object.keys(
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid,
        );
        assert.equal(navigationUuids.length, 1);
        const firstNavigationBatch: NavigationBatch =
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid[
            navigationUuids[0]
          ];
        assert.equal(firstNavigationBatch.childEnvelopes.length, 15);
        const {
          httpRequestCount,
          httpResponseCount,
          httpRedirectCount,
          javascriptOperationCount,
        } = firstNavigationBatch;
        assert.deepStrictEqual(
          [
            httpRequestCount,
            httpResponseCount,
            httpRedirectCount,
            javascriptOperationCount,
          ],
          [2, 2, 0, 11],
        );
      });
    });

    describe("Queue processing 10 hours after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 10 * 60 * 60);
      it("should have purged all navigation batches", async function() {
        navigationBatchPreprocessor.navigationBatchesByNavigationUuid = {};
        await navigationBatchPreprocessor.processQueue(nowDateTime);
        assert.equal(
          navigationBatchPreprocessor.openWpmPayloadEnvelopeProcessQueue.length,
          0,
        );
        const navigationUuids = Object.keys(
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid,
        );
        assert.equal(navigationUuids.length, 0);
      });
    });
  });

  describe("youtubeReloadWatchPageHttpRequestAndResponseSplitOrdinallyAcrossTwoNavigations", function() {
    const navigationBatchPreprocessor = new NavigationBatchPreprocessor();
    youtubeReloadWatchPageHttpRequestAndResponseSplitOrdinallyAcrossTwoNavigations.map(
      (openWpmPayloadEnvelope: OpenWpmPayloadEnvelope) => {
        if (
          navigationBatchPreprocessor.shouldBeBatched(openWpmPayloadEnvelope)
        ) {
          navigationBatchPreprocessor.queueForProcessing(
            openWpmPayloadEnvelope,
          );
        }
      },
    );

    const firstVisitIsoDateTimeString = "2020-05-26T06:35:38.614Z";
    const firstVisitDateTime = parseIsoDateTimeString(
      firstVisitIsoDateTimeString,
    );

    describe("Subsequent queue processing 12 seconds after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 12);
      it("should have found two navigation batches", async function() {
        navigationBatchPreprocessor.navigationBatchesByNavigationUuid = {};
        await navigationBatchPreprocessor.processQueue(nowDateTime);
        assert.equal(
          navigationBatchPreprocessor.openWpmPayloadEnvelopeProcessQueue.length,
          2,
        );
        const navigationUuids = Object.keys(
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid,
        );
        assert.equal(navigationUuids.length, 2);
        const oneNavigationBatch: NavigationBatch =
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid[
            "e8018778-7f92-432a-814b-ac4312e482f0"
          ];
        assert.equal(oneNavigationBatch.childEnvelopes.length, 2);
        assert.deepStrictEqual(
          [
            oneNavigationBatch.httpRequestCount,
            oneNavigationBatch.httpResponseCount,
            oneNavigationBatch.httpRedirectCount,
            oneNavigationBatch.capturedContentCount,
          ],
          [2, 0, 0, 0],
        );

        const anotherNavigationBatch: NavigationBatch =
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid[
            "e3d1dbba-835f-4837-b3ed-56671cd0419b"
          ];
        assert.equal(anotherNavigationBatch.childEnvelopes.length, 2);
        assert.deepStrictEqual(
          [
            anotherNavigationBatch.httpRequestCount,
            anotherNavigationBatch.httpResponseCount,
            anotherNavigationBatch.httpRedirectCount,
            anotherNavigationBatch.capturedContentCount,
          ],
          [0, 1, 0, 1],
        );
      });
    });

    describe("Subsequent queue processing 10 hours after after the visits", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 10 * 60 * 60);
      it("should have purged all navigation batches", async function() {
        navigationBatchPreprocessor.navigationBatchesByNavigationUuid = {};
        await navigationBatchPreprocessor.processQueue(nowDateTime);
        assert.equal(
          navigationBatchPreprocessor.openWpmPayloadEnvelopeProcessQueue.length,
          0,
        );
        const navigationUuids = Object.keys(
          navigationBatchPreprocessor.navigationBatchesByNavigationUuid,
        );
        assert.equal(navigationUuids.length, 0);
      });
    });
  });
});

import { assert } from "chai";
import {
  NavigationBatch,
  StudyPayloadEnvelope,
  StudyPayloadPreprocessor,
} from "./StudyPayloadPreprocessor";
import { parseIsoDateTimeString } from "./dateUtils";
import { addSeconds } from "date-fns";
import { openwpmTestPagesCanvasFingerprintingQueue } from "./fixtures/openwpmTestPagesCanvasFingerprintingQueue";
import { exampleDotComVisitQueue } from "./fixtures/exampleDotComVisitQueue";
import { exampleDotComVisitFollowedByMoreInformationLinkClickQueue } from "./fixtures/exampleDotComVisitFollowedByMoreInformationLinkClickQueue";

describe("StudyPayloadPreprocessor", function() {
  it("should exist", function() {
    const studyPayloadPreprocessor = new StudyPayloadPreprocessor();
    assert.isNotEmpty(studyPayloadPreprocessor);
  });

  describe("Example.com visit", function() {
    const studyPayloadPreprocessor = new StudyPayloadPreprocessor();
    exampleDotComVisitQueue.map(
      (studyPayloadEnvelope: StudyPayloadEnvelope) => {
        if (studyPayloadPreprocessor.shouldBeBatched(studyPayloadEnvelope)) {
          studyPayloadPreprocessor.queueForProcessing(studyPayloadEnvelope);
        }
      },
    );

    const firstVisitIsoDateTimeString = "2018-11-23T01:34:40.475Z";
    const firstVisitDateTime = parseIsoDateTimeString(
      firstVisitIsoDateTimeString,
    );

    describe("Queue processing 5 seconds after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 5);
      it("should not yield any navigation batches to send", async function() {
        studyPayloadPreprocessor.navigationBatchSendQueue = [];
        await studyPayloadPreprocessor.processQueue(nowDateTime);
        assert.equal(
          studyPayloadPreprocessor.navigationBatchSendQueue.length,
          0,
        );
      });
    });

    describe("Queue processing 20 seconds after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 20);
      it("should yield relevant navigation batches to send", async function() {
        studyPayloadPreprocessor.navigationBatchSendQueue = [];
        await studyPayloadPreprocessor.processQueue(nowDateTime);
        assert.equal(
          studyPayloadPreprocessor.studyPayloadEnvelopeProcessQueue.length,
          0,
        );
        assert.equal(
          studyPayloadPreprocessor.navigationBatchSendQueue.length,
          1,
        );
        const firstNavigationBatch: NavigationBatch =
          studyPayloadPreprocessor.navigationBatchSendQueue[0];
        assert.equal(firstNavigationBatch.childEnvelopes.length, 4);
        assert.equal(firstNavigationBatch.httpRequestCount, 2);
        assert.equal(firstNavigationBatch.httpResponseCount, 2);
        assert.equal(firstNavigationBatch.httpRedirectCount, 0);
        assert.equal(firstNavigationBatch.javascriptOperationCount, 0);
      });
    });
  });

  describe("Example.com visit followed by 'More information' link click", function() {
    const studyPayloadPreprocessor = new StudyPayloadPreprocessor();
    exampleDotComVisitFollowedByMoreInformationLinkClickQueue.map(
      (studyPayloadEnvelope: StudyPayloadEnvelope) => {
        if (studyPayloadPreprocessor.shouldBeBatched(studyPayloadEnvelope)) {
          studyPayloadPreprocessor.queueForProcessing(studyPayloadEnvelope);
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

    describe("Queue processing 5 seconds after the first visit (around the time of the second visit)", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 5);
      it("should not yield any navigation batches to send", async function() {
        studyPayloadPreprocessor.navigationBatchSendQueue = [];
        await studyPayloadPreprocessor.processQueue(nowDateTime);
        assert.equal(
          studyPayloadPreprocessor.navigationBatchSendQueue.length,
          0,
        );
      });
    });

    describe("Subsequent queue processing 12 seconds after the visit (around 7 seconds after the second visit)", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 12);
      it("should yield relevant navigation batches to send", async function() {
        studyPayloadPreprocessor.navigationBatchSendQueue = [];
        await studyPayloadPreprocessor.processQueue(nowDateTime);
        assert.equal(
          studyPayloadPreprocessor.studyPayloadEnvelopeProcessQueue.length,
          23,
        );
        assert.equal(
          studyPayloadPreprocessor.navigationBatchSendQueue.length,
          1,
        );
        const firstNavigationBatch: NavigationBatch =
          studyPayloadPreprocessor.navigationBatchSendQueue[0];
        assert.equal(firstNavigationBatch.childEnvelopes.length, 4);
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
          [2, 2, 0, 0],
        );
      });
    });

    describe("Subsequent queue processing 17 seconds after the visit (around 12 seconds after the second visit)", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 17);
      it("should yield relevant navigation batches to send", async function() {
        studyPayloadPreprocessor.navigationBatchSendQueue = [];
        await studyPayloadPreprocessor.processQueue(nowDateTime);
        assert.equal(
          studyPayloadPreprocessor.studyPayloadEnvelopeProcessQueue.length,
          0,
        );
        assert.equal(
          studyPayloadPreprocessor.navigationBatchSendQueue.length,
          1,
        );
        const firstNavigationBatch: NavigationBatch =
          studyPayloadPreprocessor.navigationBatchSendQueue[0];
        assert.equal(firstNavigationBatch.childEnvelopes.length, 22);
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
          [11, 10, 1, 0],
        );
      });
    });

    describe("Subsequent queue processing 25 seconds after the visit (around 20 seconds after the second visit)", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 25);
      it("should not yield any navigation batches to send", async function() {
        studyPayloadPreprocessor.navigationBatchSendQueue = [];
        await studyPayloadPreprocessor.processQueue(nowDateTime);
        assert.equal(
          studyPayloadPreprocessor.studyPayloadEnvelopeProcessQueue.length,
          0,
        );
        assert.equal(
          studyPayloadPreprocessor.navigationBatchSendQueue.length,
          0,
        );
      });
    });
  });

  describe("OpenWPM http://localtest.me:8000/test_pages/canvas_fingerprinting.html", function() {
    const studyPayloadPreprocessor = new StudyPayloadPreprocessor();
    openwpmTestPagesCanvasFingerprintingQueue.map(
      (studyPayloadEnvelope: StudyPayloadEnvelope) => {
        if (studyPayloadPreprocessor.shouldBeBatched(studyPayloadEnvelope)) {
          studyPayloadPreprocessor.queueForProcessing(studyPayloadEnvelope);
        }
      },
    );

    const firstVisitIsoDateTimeString = "2018-11-26T14:11:51.759Z";
    const firstVisitDateTime = parseIsoDateTimeString(
      firstVisitIsoDateTimeString,
    );

    describe("Queue processing 5 seconds after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 5);
      it("should not yield any navigation batches to send", async function() {
        studyPayloadPreprocessor.navigationBatchSendQueue = [];
        await studyPayloadPreprocessor.processQueue(nowDateTime);
        assert.equal(
          studyPayloadPreprocessor.navigationBatchSendQueue.length,
          0,
        );
      });
    });

    describe("Queue processing 20 seconds after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 20);
      it("should yield relevant navigation batches to send", async function() {
        studyPayloadPreprocessor.navigationBatchSendQueue = [];
        await studyPayloadPreprocessor.processQueue(nowDateTime);
        assert.equal(
          studyPayloadPreprocessor.studyPayloadEnvelopeProcessQueue.length,
          0,
        );
        assert.equal(
          studyPayloadPreprocessor.navigationBatchSendQueue.length,
          1,
        );
        const firstNavigationBatch: NavigationBatch =
          studyPayloadPreprocessor.navigationBatchSendQueue[0];
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
  });

  describe("Process large navigation batch from modified OpenWPM http://localtest.me:8000/test_pages/canvas_fingerprinting.html queue", function() {
    // Inject two large values
    const largeOpenwpmTestPagesCanvasFingerprintingQueue = JSON.parse(
      JSON.stringify(openwpmTestPagesCanvasFingerprintingQueue),
    );
    const str300kb = "01234567890".repeat(100 * 300);
    largeOpenwpmTestPagesCanvasFingerprintingQueue[3].javascriptOperation.value = str300kb;
    largeOpenwpmTestPagesCanvasFingerprintingQueue[10].javascriptOperation.value = str300kb;

    const studyPayloadPreprocessor = new StudyPayloadPreprocessor();
    largeOpenwpmTestPagesCanvasFingerprintingQueue.map(
      (studyPayloadEnvelope: StudyPayloadEnvelope) => {
        if (studyPayloadPreprocessor.shouldBeBatched(studyPayloadEnvelope)) {
          studyPayloadPreprocessor.queueForProcessing(studyPayloadEnvelope);
        }
      },
    );

    const firstVisitIsoDateTimeString = "2018-11-26T14:11:51.759Z";
    const firstVisitDateTime = parseIsoDateTimeString(
      firstVisitIsoDateTimeString,
    );

    describe("Queue processing 5 seconds after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 5);
      it("should not yield any navigation batches to send", async function() {
        studyPayloadPreprocessor.navigationBatchSendQueue = [];
        await studyPayloadPreprocessor.processQueue(nowDateTime);
        assert.equal(
          studyPayloadPreprocessor.navigationBatchSendQueue.length,
          0,
        );
      });
    });

    describe("Queue processing 20 seconds after the visit", function() {
      const nowDateTime = addSeconds(firstVisitDateTime, 20);
      it("should yield relevant navigation batches to send", async function() {
        studyPayloadPreprocessor.navigationBatchSendQueue = [];
        await studyPayloadPreprocessor.processQueue(nowDateTime);
        assert.equal(
          studyPayloadPreprocessor.studyPayloadEnvelopeProcessQueue.length,
          0,
        );
        assert.equal(
          studyPayloadPreprocessor.navigationBatchSendQueue.length,
          1,
        );
        const firstNavigationBatch: NavigationBatch =
          studyPayloadPreprocessor.navigationBatchSendQueue[0];
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

        /*
        await this.telemetrySender.sendStudyPayloadEnvelope(
          studyPayloadEnvelope,
        );
        */
      });
    });
  });
});

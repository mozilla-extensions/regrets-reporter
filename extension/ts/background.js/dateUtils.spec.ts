import { assert } from "chai";
import {
  isoDateTimeStringsWithinFutureSecondThreshold,
  parseIsoDateTimeString,
} from "./dateUtils";

describe("dateUtils", function() {
  describe("parseIsoDateTimeString", function() {
    it("ISO date time strings should be parsable", function() {
      const dateTimeIsoString = "2018-11-22T23:13:05.622Z";
      const parsedDateTime = parseIsoDateTimeString(dateTimeIsoString);
      assert.equal(parsedDateTime.toISOString(), dateTimeIsoString);
    });
  });
  describe("isoDateTimeStringsWithinFutureSecondThreshold", function() {
    it("true when not yet passed threshold", function() {
      const presentIsoDateTimeString = "2018-11-22T23:13:05.622Z";
      const futureIsoDateTimeString = "2018-11-22T23:13:06.622Z";
      const seconds = 10;
      const result = isoDateTimeStringsWithinFutureSecondThreshold(
        presentIsoDateTimeString,
        futureIsoDateTimeString,
        seconds,
      );
      assert.isTrue(result);
    });
    it("false when has passed threshold", function() {
      const presentIsoDateTimeString = "2018-11-22T23:13:05.622Z";
      const futureIsoDateTimeString = "2018-11-22T23:13:16.622Z";
      const seconds = 10;
      const result = isoDateTimeStringsWithinFutureSecondThreshold(
        presentIsoDateTimeString,
        futureIsoDateTimeString,
        seconds,
      );
      assert.isFalse(result);
    });
    it("true for past events (past events are indeed within/before future threshold)", function() {
      const presentIsoDateTimeString = "2018-11-22T23:13:05.622Z";
      const futureIsoDateTimeString = "2018-11-22T23:13:00.622Z";
      const seconds = 10;
      const result = isoDateTimeStringsWithinFutureSecondThreshold(
        presentIsoDateTimeString,
        futureIsoDateTimeString,
        seconds,
      );
      assert.isTrue(result);
    });
  });
});

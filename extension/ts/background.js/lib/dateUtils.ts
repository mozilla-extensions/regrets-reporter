import { parse } from "date-fns";
import { dateTimeUnicodeFormatString } from "./openwpm-webext-instrumentation";
import { differenceInMilliseconds } from "date-fns";

export const parseIsoDateTimeString = isoDateTimeString => {
  return parse(isoDateTimeString, dateTimeUnicodeFormatString, new Date());
};

export const isoDateTimeStringsWithinFutureSecondThreshold = (
  presentIsoDateTimeString: string,
  futureIsoDateTimeString: string,
  seconds: number,
) => {
  const presentDateTime = parseIsoDateTimeString(presentIsoDateTimeString);
  const futureDateTime = parseIsoDateTimeString(futureIsoDateTimeString);
  const diffInMs = differenceInMilliseconds(futureDateTime, presentDateTime);
  // console.log("presentDateTime, futureDateTime, diff", presentDateTime, futureDateTime, diffInMs);
  return diffInMs / 1000 <= seconds;
};

import * as Sentry from "@sentry/browser";
import { config } from "../config";

Sentry.init({ dsn: config.sentryDsn });

/**
 * Required for Sentry to map source-map paths properly
 */
Sentry.configureScope(scope => {
  scope.addEventProcessor(async (event: any) => {
    // console.log("Unprocessed sentry event", Object.assign({}, {event}));

    const normalizeUrl = url => {
      return url.replace(
        /(webpack_require__@)?(moz|chrome)-extension:\/\/[^\/]+\//,
        "~/",
      );
    };

    if (event.culprit) {
      event.culprit = normalizeUrl(event.culprit);
    }

    if (event.exception) {
      event.exception.values[0].stacktrace.frames = event.exception.values[0].stacktrace.frames.map(
        frame => {
          frame.filename = normalizeUrl(frame.filename);
          return frame;
        },
      );
    }

    // console.log("Processed sentry event", {event});
    return event;
  });
});

export { Sentry };

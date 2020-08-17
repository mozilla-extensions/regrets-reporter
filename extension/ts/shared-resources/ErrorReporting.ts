import * as Sentry from "@sentry/browser";
import { config } from "../config";
import { ExtensionPreferences, Store } from "../background.js/Store";
import {
  communicateExtensionPreferenceChangesToContentScripts,
  subscribeToExtensionPreferenceChangesInBackgroundScript,
  subscribeToExtensionPreferenceChangesInContentScript,
} from "./subscribeToExtensionPreferenceChanges";
import { Runtime } from "webextension-polyfill-ts";
import Port = Runtime.Port;
import { flatten } from "flat";

Sentry.init({ dsn: config.sentryDsn });

const enableErrorReporting = () =>
  (Sentry.getCurrentHub()
    .getClient()
    .getOptions().enabled = true);
const disableErrorReporting = () =>
  (Sentry.getCurrentHub()
    .getClient()
    .getOptions().enabled = false);

// Start with Sentry disabled
disableErrorReporting();

export const toggleErrorReportingBasedAsPerExtensionPreferences = (
  extensionPreferences: ExtensionPreferences,
) => {
  if (extensionPreferences.enableErrorReporting) {
    enableErrorReporting();
    Sentry.configureScope(function(scope) {
      scope.setTag("extension.version", extensionPreferences.extensionVersion);
      scope.setUser({
        id: extensionPreferences.extensionInstallationErrorReportingUuid,
      });
    });
    console.info("Enabled error reporting");
  } else {
    disableErrorReporting();
    console.info("Disabled error reporting");
  }
};

export const initErrorReportingInBackgroundScript = async (
  store: Store,
  portNames: string[],
): Promise<(port: Port) => void> => {
  console.info(
    `Inquiring about error reporting preference in background script`,
  );
  await subscribeToExtensionPreferenceChangesInBackgroundScript(
    store,
    toggleErrorReportingBasedAsPerExtensionPreferences,
  );
  // Set up the port listeners that initErrorReportingInContentScript()
  // expects to be available
  return communicateExtensionPreferenceChangesToContentScripts(
    store,
    portNames,
  );
};

export const initErrorReportingInContentScript = async (portName: string) => {
  console.info(`Inquiring about error reporting preference in "${portName}"`);
  await subscribeToExtensionPreferenceChangesInContentScript(
    portName,
    toggleErrorReportingBasedAsPerExtensionPreferences,
  );
};

export const captureExceptionWithExtras = (exception, extras = null) => {
  Sentry.withScope(scope => {
    if (extras !== null) {
      scope.setExtras(flatten(extras));
    }
    Sentry.captureException(exception);
  });
};

/**
 * Required for Sentry to map source-map paths properly
 */
Sentry.configureScope(scope => {
  scope.addEventProcessor(async (event: any) => {
    // console.log("Unprocessed sentry event", Object.assign({}, { event }));

    const normalizeUrl = url => {
      return url.replace(
        /(webpack_require__@)?(moz|chrome)-extension:\/\/[^\/]+\//,
        "~/",
      );
    };

    if (event.culprit) {
      event.culprit = normalizeUrl(event.culprit);
    }

    if (
      event.exception &&
      event.exception.values &&
      event.exception.values[0] &&
      event.exception.values[0].stacktrace &&
      event.exception.values[0].stacktrace.frames
    ) {
      event.exception.values[0].stacktrace.frames = event.exception.values[0].stacktrace.frames.map(
        frame => {
          frame.filename = normalizeUrl(frame.filename);
          return frame;
        },
      );
    }

    // console.log("Processed sentry event", { event });
    return event;
  });
});

export { Sentry };

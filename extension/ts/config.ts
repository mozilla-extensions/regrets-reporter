export const config = {
  sentryDsn: process.env.SENTRY_DSN,
  telemetryServer: process.env.TELEMETRY_SERVER,
  navigationBatchProcessor: {
    navigationAgeThresholdInSeconds: 60 * 60 * 24 * 7 * 4, // stop listening to opened tabs after 4 weeks
    navigationBatchChildEnvelopeAgeThresholdInSeconds: 60 * 60 * 5, // stop listening for traffic data after 5 hours
    orphanAgeThresholdInSeconds: 60 * 5, // assume non-batched child packages to be orphans after 5 minutes
  },
  privacyNoticeUrl:
    // "https://foundation.mozilla.org/campaigns/regretsreporter-privacy-notice",
    "https://sites.google.com/mozillafoundation.org/regrets-reporter-staff-test/privacy-notice",
  feedbackSurveyUrl:
    "https://qsurvey.mozilla.com/s3/regrets-reporter-product-feedback",
};

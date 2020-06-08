export const config = {
  sentryDsn: process.env.SENTRY_DSN,
  telemetryServer: process.env.TELEMETRY_SERVER,
  navigationBatchProcessor: {
    navigationAgeThresholdInSeconds: 60 * 60 * 5,
    orphanAgeThresholdInSeconds: 25,
  },
  privacyNoticeUrl:
    "https://foundation.mozilla.org/campaigns/regretsreporter-privacy-notice",
  feedbackSurveyUrl:
    "https://qsurvey.mozilla.com/s3/Regrets-Reporter-Product-Feedback",
};
